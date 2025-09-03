-- Erstellen einer Funktion zum Erstellen der system_settings-Tabelle
CREATE OR REPLACE FUNCTION create_system_settings_table()
RETURNS void AS $$
BEGIN
  -- Tabelle erstellen, wenn sie nicht existiert
  CREATE TABLE IF NOT EXISTS system_settings (
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
  );

  -- Standardeinstellungen einfügen, wenn keine vorhanden sind
  INSERT INTO system_settings (id, site_name, site_description, contact_email, support_phone, maintenance_mode, registration_enabled, default_subscription_days, max_featured_restaurants, updated_at)
  SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID, 
    'Contact Tables', 
    'Restaurant Reservierungssystem', 
    'info@contact-tables.org', 
    '+49123456789', 
    FALSE, 
    TRUE, 
    30, 
    6, 
    NOW()
  WHERE NOT EXISTS (SELECT 1 FROM system_settings);
END;
$$ LANGUAGE plpgsql;
