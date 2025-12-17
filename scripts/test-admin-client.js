// Test-Skript für den Admin-Client
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

// Direkte Verwendung von Supabase statt des Next.js-Moduls
const { createClient } = require('@supabase/supabase-js');

async function testAdminClient() {
  console.log('=== Test Admin Client ===');
  console.log('Umgebungsvariablen:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_SUPABASE_URL vorhanden?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY vorhanden?', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log('SUPABASE_SERVICE_ROLE_KEY vorhanden?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('SUPABASE_SERVICE_ROLE_KEY Länge:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0);
  console.log('SUPABASE_SERVICE_ROLE_KEY Anfang:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...' : 'nicht vorhanden');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Fehlende Umgebungsvariablen:', {
        url: !!supabaseUrl,
        serviceKey: !!supabaseServiceKey
      });
      return;
    }
    
    console.log('\nErstelle Admin-Client mit Service Role Key...');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Admin-Client erfolgreich erstellt!');
    
    // Test-Query mit Anon-Key ausführen
    console.log('\nErstelle regulären Client mit Anon-Key...');
    const regularClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('\nFühre Test-Query mit Anon-Key aus...');
    const { data: anonData, error: anonError } = await regularClient
      .from('email_campaigns')
      .select('id')
      .limit(1);
      
    if (anonError) {
      console.log('Erwarteter Fehler mit Anon-Key:', anonError.message);
    } else {
      console.log('Unerwarteter Erfolg mit Anon-Key:', anonData);
    }
    
    // Test-Query mit Service Role Key ausführen
    console.log('\nFühre Test-Query mit Service Role Key aus...');
    const { data, error } = await adminClient
      .from('email_campaigns')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Fehler bei der Test-Query mit Service Role Key:', error);
    } else {
      console.log('Test-Query mit Service Role Key erfolgreich!');
      console.log('Ergebnis:', data);
    }
    
    // Test-Query für eine andere Tabelle ohne RLS
    console.log('\nFühre Test-Query für Tabelle ohne RLS aus...');
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (profileError) {
      console.error('Fehler bei der Test-Query für profiles:', profileError);
    } else {
      console.log('Test-Query für profiles erfolgreich!');
      console.log('Ergebnis:', profileData);
    }
  } catch (error) {
    console.error('Fehler beim Erstellen des Admin-Clients:', error);
  }
}

testAdminClient();
