import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient, createClient } from '@/utils/supabase/server';

interface TemplatesResponse {
  ok: boolean;
  message: string;
  data?: any[];
}

/**
 * API-Endpunkt zum Abrufen von E-Mail-Vorlagen
 * Direkte Route ohne Authentifizierung für Debugging-Zwecke
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<TemplatesResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    console.log('Templates API: Lade E-Mail-Vorlagen...');
    console.log('Templates API: Request-Headers:', req.headers);
    
    // Statische Demo-Vorlagen direkt zurückgeben, ohne Supabase-Verbindung
    const demoTemplates = [
      {
        id: 'welcome-template-static',
        name: 'Willkommens-E-Mail (Statisch)',
        subject: 'Willkommen bei Contact-Tables',
        content: '<h1>Willkommen bei Contact-Tables</h1><p>Wir freuen uns, Sie an Bord zu haben!</p>',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      },
      {
        id: 'newsletter-template-static',
        name: 'Newsletter-Vorlage (Statisch)',
        subject: 'Neuigkeiten von Contact-Tables',
        content: '<h1>Neuigkeiten von Contact-Tables</h1><p>Hier sind die neuesten Updates...</p>',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      },
      {
        id: 'reminder-template-static',
        name: 'Erinnerungs-E-Mail (Statisch)',
        subject: 'Erinnerung von Contact-Tables',
        content: '<h1>Erinnerung</h1><p>Wir möchten Sie an Ihre bevorstehende Reservierung erinnern.</p>',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      }
    ];
    
    console.log('Templates API: Sende statische Demo-Vorlagen zurück');
    return res.status(200).json({
      ok: true,
      message: 'Statische Demo-Vorlagen geladen',
      data: demoTemplates
    });
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    
    // Auch bei Fehlern statische Vorlagen zurückgeben
    const fallbackTemplates = [
      {
        id: 'fallback-template-1',
        name: 'Notfall-Vorlage 1',
        subject: 'Wichtige Information',
        content: '<h1>Wichtige Information</h1><p>Dies ist eine Notfall-Vorlage.</p>',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      },
      {
        id: 'fallback-template-2',
        name: 'Notfall-Vorlage 2',
        subject: 'Systembenachrichtigung',
        content: '<h1>Systembenachrichtigung</h1><p>Dies ist eine automatische Nachricht.</p>',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      }
    ];
    
    return res.status(200).json({
      ok: true,
      message: 'Notfall-Vorlagen geladen (nach Fehler)',
      data: fallbackTemplates
    });
  }
}

// Direkte Route ohne Authentifizierung
