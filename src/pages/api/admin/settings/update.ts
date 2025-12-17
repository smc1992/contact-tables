import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../middleware/withAdminAuth';
import { createClient } from '@supabase/supabase-js';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Benutzer ist bereits durch withAdminAuth authentifiziert und autorisiert
    // userId ist die ID des authentifizierten Admin-Benutzers
    
    // Admin-Client für Schreibzugriff auf system_settings verwenden
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase URL oder Service Key fehlt');
      return res.status(500).json({ error: 'Server-Konfigurationsfehler' });
    }
    
    // Direkten Supabase-Client mit Service-Role-Key erstellen
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    
    // Einstellungen aus dem Request-Body extrahieren
    const settings = req.body;
    
    // Sicherstellen, dass eine ID vorhanden ist und als gültige UUID formatiert ist
    const id = settings.id || '00000000-0000-0000-0000-000000000001';
    // Stellen Sie sicher, dass die ID eine gültige UUID ist
    const validUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) 
      ? id 
      : '00000000-0000-0000-0000-000000000001';
    const updatedAt = new Date().toISOString();
    
    // Bereite die Werte für das SQL-Statement vor
    const siteName = settings.site_name || 'Contact Tables';
    const siteDescription = settings.site_description || 'Restaurant Reservierungssystem';
    const contactEmail = settings.contact_email || 'info@contact-tables.org';
    const supportPhone = settings.support_phone || '+49123456789';
    const maintenanceMode = typeof settings.maintenance_mode === 'boolean' ? settings.maintenance_mode : false;
    const registrationEnabled = typeof settings.registration_enabled === 'boolean' ? settings.registration_enabled : true;
    const defaultSubscriptionDays = settings.default_subscription_days || 30;
    const maxFeaturedRestaurants = settings.max_featured_restaurants || 6;
    const googleMapsApiKey = settings.google_maps_api_key || null;
    const smtpHost = settings.smtp_host || null;
    const smtpPort = settings.smtp_port || null;
    const smtpUser = settings.smtp_user || null;
    const smtpPassword = settings.smtp_password || null;
    const emailSignature = settings.email_signature || '<p>Mit freundlichen Grüßen,<br>Ihr Contact Tables Team</p>';
    
    console.log('Speichere Einstellungen mit ID:', id);
    
    // Direktes SQL-Update ausführen
    const { data, error } = await supabase.rpc('update_system_settings', {
      p_id: validUuid,
      p_site_name: siteName,
      p_site_description: siteDescription,
      p_contact_email: contactEmail,
      p_support_phone: supportPhone,
      p_maintenance_mode: maintenanceMode,
      p_registration_enabled: registrationEnabled,
      p_default_subscription_days: defaultSubscriptionDays,
      p_max_featured_restaurants: maxFeaturedRestaurants,
      p_google_maps_api_key: googleMapsApiKey,
      p_smtp_host: smtpHost,
      p_smtp_port: smtpPort,
      p_smtp_user: smtpUser,
      p_smtp_password: smtpPassword,
      p_email_signature: emailSignature
    });

    // Fallback: Wenn die RPC-Funktion nicht existiert, versuchen wir es mit direktem SQL
    if (error && error.message.includes('does not exist')) {
      console.log('RPC update_system_settings nicht verfügbar, erstelle die Funktion');
      
      // Erstelle die RPC-Funktion
      const { error: createFunctionError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION update_system_settings(
            p_id UUID,
            p_site_name VARCHAR,
            p_site_description TEXT,
            p_contact_email VARCHAR,
            p_support_phone VARCHAR,
            p_maintenance_mode BOOLEAN,
            p_registration_enabled BOOLEAN,
            p_default_subscription_days INTEGER,
            p_max_featured_restaurants INTEGER,
            p_google_maps_api_key VARCHAR,
            p_smtp_host VARCHAR,
            p_smtp_port INTEGER,
            p_smtp_user VARCHAR,
            p_smtp_password VARCHAR,
            p_email_signature TEXT
          ) RETURNS JSONB AS $$
          DECLARE
            result JSONB;
          BEGIN
            UPDATE system_settings
            SET 
              site_name = p_site_name,
              site_description = p_site_description,
              contact_email = p_contact_email,
              support_phone = p_support_phone,
              maintenance_mode = p_maintenance_mode,
              registration_enabled = p_registration_enabled,
              default_subscription_days = p_default_subscription_days,
              max_featured_restaurants = p_max_featured_restaurants,
              google_maps_api_key = p_google_maps_api_key,
              smtp_host = p_smtp_host,
              smtp_port = p_smtp_port,
              smtp_user = p_smtp_user,
              smtp_password = p_smtp_password,
              email_signature = p_email_signature,
              updated_at = NOW()
            WHERE id = p_id
            RETURNING to_jsonb(system_settings.*) INTO result;
            
            IF result IS NULL THEN
              INSERT INTO system_settings (
                id, site_name, site_description, contact_email, support_phone,
                maintenance_mode, registration_enabled, default_subscription_days,
                max_featured_restaurants, google_maps_api_key, smtp_host, smtp_port,
                smtp_user, smtp_password, email_signature, updated_at
              ) VALUES (
                p_id, p_site_name, p_site_description, p_contact_email, p_support_phone,
                p_maintenance_mode, p_registration_enabled, p_default_subscription_days,
                p_max_featured_restaurants, p_google_maps_api_key, p_smtp_host, p_smtp_port,
                p_smtp_user, p_smtp_password, p_email_signature, NOW()
              )
              RETURNING to_jsonb(system_settings.*) INTO result;
            END IF;
            
            RETURN result;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });
      
      if (createFunctionError) {
        console.error('Fehler beim Erstellen der RPC-Funktion:', createFunctionError);
        return res.status(500).json({ 
          error: 'Fehler beim Erstellen der RPC-Funktion', 
          details: createFunctionError.message,
          code: createFunctionError.code,
          hint: createFunctionError.hint || 'Keine Hinweise verfügbar'
        });
      }
      
      // Versuche erneut, die Einstellungen zu aktualisieren
      const { data: retryData, error: retryError } = await supabase.rpc('update_system_settings', {
        p_id: validUuid,
        p_site_name: siteName,
        p_site_description: siteDescription,
        p_contact_email: contactEmail,
        p_support_phone: supportPhone,
        p_maintenance_mode: maintenanceMode,
        p_registration_enabled: registrationEnabled,
        p_default_subscription_days: defaultSubscriptionDays,
        p_max_featured_restaurants: maxFeaturedRestaurants,
        p_google_maps_api_key: googleMapsApiKey,
        p_smtp_host: smtpHost,
        p_smtp_port: smtpPort,
        p_smtp_user: smtpUser,
        p_smtp_password: smtpPassword,
        p_email_signature: emailSignature
      });
      
      if (retryError) {
        console.error('Fehler beim erneuten Speichern der Einstellungen:', retryError);
        return res.status(500).json({ 
          error: 'Fehler beim Speichern der Einstellungen', 
          details: retryError.message,
          code: retryError.code,
          hint: retryError.hint || 'Keine Hinweise verfügbar'
        });
      }
      
      return res.status(200).json({ success: true, data: retryData });
    } else if (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
      return res.status(500).json({ 
        error: 'Fehler beim Speichern der Einstellungen', 
        details: error.message,
        code: error.code,
        hint: error.hint || 'Keine Hinweise verfügbar'
      });
    }
    
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return res.status(500).json({ 
      error: 'Interner Serverfehler',
      details: error.message || 'Unbekannter Fehler'
    });
  }
}

// Export der API-Route mit Admin-Authentifizierung
export default withAdminAuth(handler);
