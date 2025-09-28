import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';

interface TrackingResponse {
  ok: boolean;
  message?: string;
}

/**
 * API-Route zum Tracking von Email-Öffnungen und Klicks
 * 
 * Diese Route wird von Tracking-Pixeln und Tracking-Links in Emails aufgerufen
 * und aktualisiert den Status der entsprechenden Email-Empfänger in der Datenbank.
 * 
 * Query-Parameter:
 * - type: 'open' oder 'click' - Art des Tracking-Events
 * - rid: Recipient ID - ID des Email-Empfängers
 * - cid: Campaign ID - ID der Email-Kampagne
 * - link: (optional) - URL des geklickten Links (nur bei type=click)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrackingResponse>
) {
  // Nur GET-Anfragen erlauben (für Tracking-Pixel und Redirect-Links)
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    // Parameter aus der Anfrage extrahieren
    const { type, rid, cid, link } = req.query;
    
    // Parameter validieren
    if (!type || !rid || !cid) {
      return res.status(400).json({ ok: false, message: 'Missing required parameters' });
    }
    
    if (type !== 'open' && type !== 'click') {
      return res.status(400).json({ ok: false, message: 'Invalid tracking type' });
    }
    
    if (type === 'click' && !link) {
      return res.status(400).json({ ok: false, message: 'Missing link parameter for click tracking' });
    }
    
    // Admin-Client für Datenbankzugriff erstellen
    const adminClient = createAdminClient();
    
    // Aktuellen Status des Empfängers abrufen
    const { data: recipient, error: recipientError } = await adminClient
      .from('email_recipients')
      .select('id, status, opened_at, recipient_email')
      .eq('recipient_id', rid)
      .eq('campaign_id', cid)
      .single();
    
    if (recipientError || !recipient) {
      console.error('Error fetching recipient:', recipientError);
      // Bei Fehlern trotzdem 200 zurückgeben und Tracking-Pixel liefern,
      // um keine Fehler in der Email-Ansicht des Benutzers zu verursachen
      return sendTrackingResponse(res, type, link as string);
    }
    
    // Tracking-Daten vorbereiten
    const now = new Date().toISOString();
    
    // Status und Tracking-Daten aktualisieren
    if (type === 'open' && !recipient.opened_at) {
      // E-Mail-Öffnung tracken
      const { error: updateError } = await adminClient
        .from('email_recipients')
        .update({
          opened_at: now,
          status: 'opened'
        })
        .eq('recipient_id', rid)
        .eq('campaign_id', cid);
      
      if (updateError) {
        console.error('Error updating recipient opened_at:', updateError);
      }
    } else if (type === 'click') {
      // Link-Klick tracken
      console.log('Tracking link click:', { cid, recipient_email: recipient.recipient_email, link });
      
      const insertData = {
        campaign_id: cid,
        recipient_id: rid as string,
        recipient_email: recipient.recipient_email || '',
        link_url: link as string,
        link_id: link as string, // Verwende die URL als link_id
        clicked_at: now,
        user_agent: req.headers['user-agent'] || '',
        ip_address: (req.headers['x-forwarded-for'] as string) || (req.socket?.remoteAddress) || '127.0.0.1'
      };
      
      console.log('Insert data:', insertData);
      
      const { data: insertResult, error: clickError } = await adminClient
        .from('email_link_clicks')
        .insert(insertData)
        .select();
      
      if (clickError) {
        console.error('Error inserting link click:', clickError);
      } else {
        console.log('Link click tracked successfully:', insertResult);
        // Status auf 'clicked' setzen und Öffnungszeit ggf. nachtragen
        const { error: updateClickStatusError } = await adminClient
          .from('email_recipients')
          .update({
            status: 'clicked',
            opened_at: recipient.opened_at || now
          })
          .eq('recipient_id', rid)
          .eq('campaign_id', cid);
        if (updateClickStatusError) {
          console.error('Error updating recipient click status:', updateClickStatusError);
        }
      }
    }
    
    // Tracking-Antwort senden
    return sendTrackingResponse(res, type, link as string);
  } catch (error) {
    console.error('Error processing tracking request:', error);
    // Bei Fehlern trotzdem 200 zurückgeben und Tracking-Pixel liefern
    return sendTrackingResponse(res, req.query.type as string, req.query.link as string);
  }
}

/**
 * Sendet die entsprechende Tracking-Antwort basierend auf dem Tracking-Typ
 */
function sendTrackingResponse(
  res: NextApiResponse<TrackingResponse>,
  type: string,
  link?: string
): void {
  // Für Öffnungs-Tracking: 1x1 transparentes GIF zurückgeben
  if (type === 'open') {
    // 1x1 transparentes GIF
    const TRACKING_PIXEL = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(TRACKING_PIXEL);
    return;
  }
  
  // Für Klick-Tracking: Weiterleitung zur Ziel-URL
  if (type === 'click' && link) {
    res.writeHead(302, {
      'Location': link
    });
    res.end();
    return;
  }
  
  // Fallback
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify({ ok: true }));
  return;
}
