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
    
    // Abrufen aller E-Mail-Vorlagen aus der Datenbank
    const { data: templates, error } = await adminSupabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fehler beim Abrufen der E-Mail-Vorlagen:', error);
      return res.status(500).json({ 
        ok: false, 
        message: `Fehler beim Abrufen der E-Mail-Vorlagen: ${error.message}` 
      });
    }
    
    return res.status(200).json({
      ok: true,
      message: 'E-Mail-Vorlagen erfolgreich abgerufen',
      data: templates || []
    });
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return res.status(500).json({ 
      ok: false, 
      message: `Server-Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` 
    });
  }
}

export default withAdminAuth(handler);
