import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

interface LinkTrackingResponse {
  success: boolean;
  message?: string;
  redirectUrl?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LinkTrackingResponse>
) {
  // Nur GET-Anfragen erlauben
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  }

  try {
    const { lid, rid, cid, url } = req.query;

    // Parameter validieren
    if (!lid || !url || !cid) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // URL dekodieren
    const decodedUrl = decodeURIComponent(url as string);
    
    // Empfänger-Informationen abrufen
    let recipientEmail = '';
    let recipientId = null;
    
    if (rid) {
      const recipient = await prisma.email_recipients.findUnique({
        where: { id: rid as string }
      });
      
      if (recipient) {
        recipientEmail = recipient.recipient_email;
        recipientId = recipient.recipient_id;
      }
    }
    
    // Klick speichern
    await prisma.email_link_clicks.create({
      data: {
        campaign_id: cid as string,
        recipient_id: recipientId,
        recipient_email: recipientEmail || 'unknown',
        link_url: decodedUrl,
        link_id: lid as string,
        user_agent: req.headers['user-agent'] || '',
        ip_address: req.headers['x-forwarded-for']?.toString() || 
                   req.socket.remoteAddress || ''
      }
    });
    
    // Weiterleitung zur Ziel-URL
    res.redirect(302, decodedUrl);
  } catch (error) {
    console.error('Link tracking error:', error);
    
    // Bei Fehler zur Standard-URL weiterleiten (falls vorhanden)
    if (req.query.url) {
      const fallbackUrl = decodeURIComponent(req.query.url as string);
      return res.redirect(302, fallbackUrl);
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error'
    });
  }
}
