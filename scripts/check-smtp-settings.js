// Überprüft die SMTP-Einstellungen in der system_settings-Tabelle
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Erstelle einen Supabase-Client mit dem Service Role Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Umgebungsvariablen fehlen: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSystemSettings() {
  console.log('=== Überprüfe system_settings-Tabelle ===');
  
  try {
    // Prüfe, ob die Tabelle existiert
    const { data: tables, error: tableError } = await adminClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'system_settings');
    
    if (tableError) {
      console.error('Fehler beim Überprüfen der Tabelle:', tableError);
      return;
    }
    
    if (!tables || tables.length === 0) {
      console.log('Die system_settings-Tabelle existiert nicht!');
      return;
    }
    
    console.log('Die system_settings-Tabelle existiert.');
    
    // Hole alle Einträge aus der system_settings-Tabelle
    const { data: settings, error: settingsError } = await adminClient
      .from('system_settings')
      .select('*');
    
    if (settingsError) {
      console.error('Fehler beim Abrufen der Einstellungen:', settingsError);
      return;
    }
    
    if (!settings || settings.length === 0) {
      console.log('Keine Einträge in der system_settings-Tabelle gefunden!');
      return;
    }
    
    console.log('Gefundene Einstellungen:');
    console.log(JSON.stringify(settings, null, 2));
    
    // Überprüfe SMTP-Einstellungen
    const smtpSettings = settings.find(s => s.smtp_host);
    if (smtpSettings) {
      console.log('\nSMTP-Einstellungen gefunden:');
      console.log('SMTP-Host:', smtpSettings.smtp_host);
      console.log('SMTP-Port:', smtpSettings.smtp_port);
      console.log('SMTP-Benutzer:', smtpSettings.smtp_user);
      console.log('SMTP-Passwort:', smtpSettings.smtp_password ? '(vorhanden)' : '(fehlt)');
      console.log('Kontakt-E-Mail:', smtpSettings.contact_email);
    } else {
      console.log('\nKeine SMTP-Einstellungen in der system_settings-Tabelle gefunden!');
    }
    
    // Überprüfe Umgebungsvariablen
    console.log('\n=== Überprüfe SMTP-Umgebungsvariablen ===');
    console.log('EMAIL_SERVER_HOST:', process.env.EMAIL_SERVER_HOST || '(nicht gesetzt)');
    console.log('EMAIL_SERVER_PORT:', process.env.EMAIL_SERVER_PORT || '(nicht gesetzt)');
    console.log('EMAIL_SERVER_USER:', process.env.EMAIL_SERVER_USER || '(nicht gesetzt)');
    console.log('EMAIL_SERVER_PASSWORD:', process.env.EMAIL_SERVER_PASSWORD ? '(vorhanden)' : '(nicht gesetzt)');
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '(nicht gesetzt)');
    
  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
  }
}

checkSystemSettings();
