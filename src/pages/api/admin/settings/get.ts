import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';
import { withAdminAuth } from '../../middleware/withAdminAuth';

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  // Nur GET-Anfragen erlauben
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Admin-Client mit Service-Role-Key erstellen
    const supabase = createAdminClient();
    
    // Einstellungen aus der Datenbank laden
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();
    
    if (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
      return res.status(500).json({ error: 'Fehler beim Laden der Einstellungen', details: error });
    }
    
    // Wenn keine Einstellungen gefunden wurden, Standardeinstellungen zurückgeben
    if (!data) {
      const defaultSettings = {
        id: '00000000-0000-0000-0000-000000000001',
        site_name: 'Contact Tables',
        site_description: 'Restaurant Reservierungssystem',
        contact_email: 'info@contact-tables.org',
        support_phone: '+49123456789',
        maintenance_mode: false,
        registration_enabled: true,
        default_subscription_days: 30,
        max_featured_restaurants: 6,
        updated_at: new Date().toISOString()
      };
      
      return res.status(200).json(defaultSettings);
    }
    
    // Einstellungen zurückgeben
    return res.status(200).json(data);
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return res.status(500).json({ 
      error: 'Interner Serverfehler', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

export default withAdminAuth(handler);
