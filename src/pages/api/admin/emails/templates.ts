import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { withAdminAuth } from './withAdminAuth';

interface TemplatesResponse {
  ok: boolean;
  message: string;
  data?: any[];
}

/**
 * API-Endpunkt zum Abrufen von E-Mail-Vorlagen
 * Nur für Administratoren zugänglich
 */
async function handler(req: NextApiRequest, res: NextApiResponse<TemplatesResponse>, userId: string) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    console.log('Lade E-Mail-Vorlagen...');
    
    const adminSupabase = createAdminClient();
    
    // Direkt versuchen, die Tabelle abzufragen
    try {
      // Abrufen aller E-Mail-Vorlagen aus der Datenbank
      const { data: templates, error } = await adminSupabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        // Wenn die Tabelle nicht existiert oder ein anderer Fehler auftritt,
        // geben wir eine leere Liste zurück
        console.warn('Fehler beim Abrufen der E-Mail-Vorlagen:', error.message);
        
        // Prüfen, ob der Fehler auf eine nicht existierende Tabelle hindeutet
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.log('Die Tabelle email_templates existiert nicht');
          
          // Erstelle Dummy-Vorlagen für die Entwicklung
          const dummyTemplates = [
            {
              id: 'welcome-template',
              name: 'Willkommens-E-Mail',
              subject: 'Willkommen bei Contact-Tables',
              content: '<h1>Willkommen bei Contact-Tables</h1><p>Wir freuen uns, Sie an Bord zu haben!</p>',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              created_by: userId
            },
            {
              id: 'newsletter-template',
              name: 'Newsletter-Vorlage',
              subject: 'Neuigkeiten von Contact-Tables',
              content: '<h1>Neuigkeiten von Contact-Tables</h1><p>Hier sind die neuesten Updates...</p>',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              created_by: userId
            }
          ];
          
          return res.status(200).json({
            ok: true,
            message: 'Demo-Vorlagen geladen (Tabelle existiert nicht)',
            data: dummyTemplates
          });
        }
        
        // Bei anderen Fehlern eine leere Liste zurückgeben
        return res.status(200).json({
          ok: true,
          message: 'Keine E-Mail-Vorlagen gefunden',
          data: []
        });
      }
      
      return res.status(200).json({
        ok: true,
        message: 'E-Mail-Vorlagen erfolgreich abgerufen',
        data: templates || []
      });
    } catch (queryError) {
      console.error('Unerwarteter Fehler beim Abfragen der E-Mail-Vorlagen:', queryError);
      
      // Bei unerwarteten Fehlern eine leere Liste zurückgeben
      return res.status(200).json({
        ok: true,
        message: 'Keine E-Mail-Vorlagen verfügbar',
        data: []
      });
    }
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return res.status(500).json({ 
      ok: false, 
      message: `Server-Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` 
    });
  }
}

export default withAdminAuth(handler);
