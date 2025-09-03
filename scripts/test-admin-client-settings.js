// Test-Skript für den Admin-Client und system_settings
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

async function testAdminClient() {
  console.log('=== Test des Admin-Clients ===');
  
  try {
    // Überprüfe die Umgebungsvariablen
    console.log('Umgebungsvariablen:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Vorhanden' : 'Fehlt');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `Vorhanden (Länge: ${supabaseServiceKey.length})` : 'Fehlt');
    
    // Überprüfe die system_settings-Tabelle
    console.log('\nÜberprüfe system_settings-Tabelle...');
    const { data: settings, error: settingsError } = await adminClient
      .from('system_settings')
      .select('*')
      .single();
    
    if (settingsError) {
      console.error('Fehler beim Abrufen der system_settings:', settingsError);
    } else {
      console.log('system_settings erfolgreich abgerufen:', settings.id);
      
      // Überprüfe die SMTP-Einstellungen
      console.log('\nSMTP-Einstellungen:');
      console.log('- smtp_host:', settings.smtp_host || 'Nicht gesetzt');
      console.log('- smtp_port:', settings.smtp_port || 'Nicht gesetzt');
      console.log('- smtp_user:', settings.smtp_user || 'Nicht gesetzt');
      console.log('- smtp_password:', settings.smtp_password ? 'Vorhanden' : 'Nicht gesetzt');
      console.log('- contact_email:', settings.contact_email || 'Nicht gesetzt');
      
      // Überprüfe, ob alle erforderlichen SMTP-Einstellungen vorhanden sind
      const smtpHost = settings.smtp_host;
      const smtpPort = settings.smtp_port;
      const smtpUser = settings.smtp_user;
      const smtpPass = settings.smtp_password;
      const fromAddress = settings.contact_email;
      
      if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromAddress) {
        console.error('\nSMTP-Konfiguration unvollständig:', {
          hostMissing: !smtpHost,
          portMissing: !smtpPort,
          userMissing: !smtpUser,
          passMissing: !smtpPass,
          fromAddressMissing: !fromAddress
        });
      } else {
        console.log('\nSMTP-Konfiguration vollständig!');
      }
    }
    
    // Überprüfe die RLS-Richtlinien für system_settings
    console.log('\nÜberprüfe RLS-Richtlinien für system_settings...');
    const { data: policies, error: policiesError } = await adminClient.rpc('get_policies_for_table', {
      table_name: 'system_settings'
    });
    
    if (policiesError) {
      console.error('Fehler beim Abrufen der RLS-Richtlinien:', policiesError);
    } else {
      console.log('RLS-Richtlinien für system_settings:', policies);
    }
    
  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
  }
}

testAdminClient();
