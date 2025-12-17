// Test-Skript für den Service Role Key
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

async function testServiceRole() {
  console.log('=== Test Service Role Key ===');
  console.log('Umgebungsvariablen:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_SUPABASE_URL vorhanden?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY vorhanden?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('SUPABASE_SERVICE_ROLE_KEY Länge:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0);
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Fehlende Umgebungsvariablen');
      return;
    }
    
    // Erstelle Admin-Client mit Service Role Key
    console.log('\nErstelle Admin-Client mit Service Role Key...');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('Admin-Client erfolgreich erstellt!');
    
    // Teste SQL-Ausführung mit Service Role
    console.log('\nFühre direktes SQL mit Service Role aus...');
    const { data: sqlData, error: sqlError } = await adminClient.rpc('execute_sql', {
      query: 'SELECT * FROM email_campaigns LIMIT 1;'
    });
    
    if (sqlError) {
      console.error('Fehler bei SQL-Ausführung:', sqlError);
      
      // Versuche eine einfachere Abfrage
      console.log('\nVersuche einfachere SQL-Abfrage...');
      const { data: simpleData, error: simpleError } = await adminClient.rpc('execute_sql', {
        query: 'SELECT current_user, current_setting(\'role\');'
      });
      
      if (simpleError) {
        console.error('Fehler bei einfacher SQL-Abfrage:', simpleError);
      } else {
        console.log('Einfache SQL-Abfrage erfolgreich:', simpleData);
      }
    } else {
      console.log('SQL-Ausführung erfolgreich:', sqlData);
    }
    
    // Teste direkten Tabellenzugriff
    console.log('\nTeste direkten Tabellenzugriff mit Service Role...');
    const { data, error } = await adminClient
      .from('email_campaigns')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Fehler bei Tabellenzugriff:', error);
    } else {
      console.log('Tabellenzugriff erfolgreich:', data);
    }
    
    // Teste Tabellenliste
    console.log('\nListe alle Tabellen auf...');
    const { data: tablesData, error: tablesError } = await adminClient.rpc('execute_sql', {
      query: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';'
    });
    
    if (tablesError) {
      console.error('Fehler beim Auflisten der Tabellen:', tablesError);
    } else {
      console.log('Tabellenliste:', tablesData);
    }
    
    // Teste RLS-Richtlinien
    console.log('\nListe RLS-Richtlinien für email_campaigns auf...');
    const { data: policiesData, error: policiesError } = await adminClient.rpc('execute_sql', {
      query: 'SELECT * FROM pg_policies WHERE tablename = \'email_campaigns\';'
    });
    
    if (policiesError) {
      console.error('Fehler beim Auflisten der RLS-Richtlinien:', policiesError);
    } else {
      console.log('RLS-Richtlinien:', policiesData);
    }
  } catch (error) {
    console.error('Fehler beim Testen des Service Role Keys:', error);
  }
}

testServiceRole();
