import { createClient, createAdminClient } from './supabase/server';

interface SystemSettings {
  id: string;
  site_name: string;
  site_description: string;
  contact_email: string;
  support_phone: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  default_subscription_days: number;
  max_featured_restaurants: number;
  google_maps_api_key?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  email_signature?: string;
  updated_at: string;
  
  // DKIM-Einstellungen
  dkim_private_key?: string;
  dkim_public_key?: string;
  dkim_selector?: string;
  
  // E-Mail-Authentifizierung und Zustellbarkeit
  spf_record?: string;
  dmarc_policy?: string;
  bounce_handling_email?: string;
}

// Cache für Systemeinstellungen
let cachedSettings: SystemSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 Minuten Cache-Gültigkeit

/**
 * Ruft die Systemeinstellungen aus der Datenbank ab
 * Verwendet einen Cache, um die Anzahl der Datenbankabfragen zu reduzieren
 */
export const getSystemSettings = async (): Promise<SystemSettings | null> => {
  // Cache temporär deaktivieren, um sicherzustellen, dass wir immer die neuesten Daten haben
  // const now = Date.now();
  // if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL) {
  //   return cachedSettings;
  // }

  try {
    // Direkt den Admin-Client verwenden, um die Systemeinstellungen abzurufen
    // Dies umgeht alle RLS-Beschränkungen
    console.log('Abrufen der Systemeinstellungen mit Admin-Client...');
    
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('system_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Fehler beim Abrufen der Systemeinstellungen:', error);
      return null;
    }

    // Cache aktualisieren
    cachedSettings = data;
    cacheTimestamp = Date.now();
    console.log('Systemeinstellungen erfolgreich geladen:', data?.id);
    
    return data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Systemeinstellungen:', error);
    return null;
  }
};

/**
 * Löscht den Cache für Systemeinstellungen
 * Sollte nach Änderungen an den Einstellungen aufgerufen werden
 */
export const clearSettingsCache = () => {
  cachedSettings = null;
  cacheTimestamp = 0;
};

export type { SystemSettings };
