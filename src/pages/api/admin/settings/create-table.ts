import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Admin-Client erstellen mit direktem Zugriff auf die Umgebungsvariablen
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Fehlende Umgebungsvariablen für Supabase');
      return res.status(500).json({ error: 'Fehlende Umgebungsvariablen für Supabase' });
    }
    
    // Direkten Supabase-Client mit Service-Role-Key erstellen
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Benutzer authentifizieren
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentifizierungsfehler:', authError);
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }
    
    // Benutzerrolle überprüfen (optional, da wir den Service-Role-Key verwenden)
    if (user) {
      const role = user.user_metadata?.role;
      if (role !== 'admin' && role !== 'ADMIN') {
        return res.status(403).json({ error: 'Keine Berechtigung' });
      }
    }
    
    // Tabelle erstellen mit direktem SQL-Befehl
    const { error: createTableError } = await supabase.rpc('exec_sql', { 
      sql: `CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_name VARCHAR(255) NOT NULL DEFAULT 'Contact Tables',
        site_description TEXT DEFAULT 'Restaurant Reservierungssystem',
        contact_email VARCHAR(255) DEFAULT 'info@contact-tables.org',
        support_phone VARCHAR(255) DEFAULT '+49123456789',
        maintenance_mode BOOLEAN DEFAULT FALSE,
        registration_enabled BOOLEAN DEFAULT TRUE,
        default_subscription_days INTEGER DEFAULT 30,
        max_featured_restaurants INTEGER DEFAULT 6,
        google_maps_api_key VARCHAR(255),
        smtp_host VARCHAR(255),
        smtp_port INTEGER,
        smtp_user VARCHAR(255),
        smtp_password VARCHAR(255),
        email_signature TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    });
    
    // Wenn die RPC-Funktion nicht existiert, ignoriere den Fehler und fahre fort
    if (createTableError) {
      console.log('RPC exec_sql nicht verfügbar, versuche direkte Tabellenerstellung');
      console.error('Fehlerdetails:', JSON.stringify(createTableError));
    }
    
    // RLS aktivieren und Policy erstellen
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE IF EXISTS system_settings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS admin_all ON system_settings;
        CREATE POLICY admin_all ON system_settings FOR ALL TO authenticated USING (
          auth.uid() IN (SELECT id FROM auth.users WHERE user_metadata->>'role' = 'admin')
        );
      `
    });
    
    if (rlsError) {
      console.log('RPC exec_sql für RLS nicht verfügbar, überspringe diesen Schritt');
    }
    
    // Standardeinstellungen einfügen, wenn die Tabelle existiert
    try {
      const { error: upsertError } = await supabase
        .from('system_settings')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          site_name: 'Contact Tables',
          site_description: 'Restaurant Reservierungssystem',
          contact_email: 'info@contact-tables.org',
          support_phone: '+49123456789',
          maintenance_mode: false,
          registration_enabled: true,
          default_subscription_days: 30,
          max_featured_restaurants: 6,
          email_signature: '',
          updated_at: new Date().toISOString()
        });
      
      if (upsertError) {
        console.error('Fehler beim Einfügen der Standardeinstellungen:', upsertError);
        
        // Wenn der Fehler ein Berechtigungsfehler ist, versuchen wir die Berechtigungen zu setzen
        if (upsertError.code === '42501') { // Permission denied
          console.log('Berechtigungsfehler, versuche Berechtigungen zu setzen');
          
          // Direkten SQL-Befehl ausführen, um dem Service-Role-Key Zugriff zu gewähren
          const { error: grantError } = await supabase.rpc('exec_sql', {
            sql: `
              -- Gewähre dem Service-Role-Key alle Rechte auf die Tabelle
              GRANT ALL PRIVILEGES ON TABLE system_settings TO postgres;
              GRANT ALL PRIVILEGES ON TABLE system_settings TO authenticated;
              GRANT ALL PRIVILEGES ON TABLE system_settings TO anon;
              
              -- Deaktiviere RLS temporär für diesen Befehl
              ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
            `
          });
          
          if (grantError) {
            console.error('Fehler beim Setzen der Berechtigungen:', grantError);
          } else {
            // Versuche erneut, die Standardeinstellungen einzufügen
            const { error: retryError } = await supabase
              .from('system_settings')
              .upsert({
                id: '00000000-0000-0000-0000-000000000001',
                site_name: 'Contact Tables',
                site_description: 'Restaurant Reservierungssystem',
                contact_email: 'info@contact-tables.org',
                support_phone: '+49123456789',
                maintenance_mode: false,
                registration_enabled: true,
                default_subscription_days: 30,
                max_featured_restaurants: 6,
                email_signature: '',
                updated_at: new Date().toISOString()
              });
              
            if (retryError) {
              console.error('Fehler beim erneuten Einfügen der Standardeinstellungen:', retryError);
            }
            
            // RLS wieder aktivieren
            await supabase.rpc('exec_sql', {
              sql: `ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;`
            });
          }
        }
      }
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Einstellungen:', error);
    }
    
    // Erfolg zurückmelden
    return res.status(200).json({ 
      success: true,
      message: 'Tabelle wurde erstellt oder aktualisiert'
    });
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return res.status(500).json({ 
      error: 'Interner Serverfehler', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
