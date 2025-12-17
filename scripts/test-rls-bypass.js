// Test-Skript für RLS-Bypass mit Service Role Key
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

async function testRlsBypass() {
  console.log('=== Test RLS-Bypass mit Service Role Key ===');
  console.log('Umgebungsvariablen:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_SUPABASE_URL vorhanden?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY vorhanden?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('SUPABASE_SERVICE_ROLE_KEY Länge:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0);
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
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
    
    // Erstelle regulären Client mit Anon Key
    console.log('\nErstelle regulären Client mit Anon Key...');
    const regularClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Regulärer Client erfolgreich erstellt!');
    
    // Teste Zugriff auf email_campaigns
    console.log('\nTeste Zugriff auf email_campaigns mit Admin-Client...');
    const { data: adminEmailCampaigns, error: adminEmailCampaignsError } = await adminClient
      .from('email_campaigns')
      .select('id')
      .limit(1);
      
    if (adminEmailCampaignsError) {
      console.log('Admin-Client kann nicht auf email_campaigns zugreifen:', adminEmailCampaignsError.message);
      console.log('Fehlerdetails:', adminEmailCampaignsError);
    } else {
      console.log('Admin-Client kann auf email_campaigns zugreifen:', adminEmailCampaigns);
    }
    
    // Teste Zugriff auf email_campaigns mit regulärem Client
    console.log('\nTeste Zugriff auf email_campaigns mit regulärem Client...');
    const { data: regularEmailCampaigns, error: regularEmailCampaignsError } = await regularClient
      .from('email_campaigns')
      .select('id')
      .limit(1);
      
    if (regularEmailCampaignsError) {
      console.log('Regulärer Client kann nicht auf email_campaigns zugreifen:', regularEmailCampaignsError.message);
    } else {
      console.log('Regulärer Client kann auf email_campaigns zugreifen:', regularEmailCampaigns);
    }
    
    // Teste Zugriff auf profiles (sollte ohne RLS sein)
    console.log('\nTeste Zugriff auf profiles mit Admin-Client...');
    const { data: adminProfiles, error: adminProfilesError } = await adminClient
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (adminProfilesError) {
      console.log('Admin-Client kann nicht auf profiles zugreifen:', adminProfilesError.message);
    } else {
      console.log('Admin-Client kann auf profiles zugreifen:', adminProfiles);
    }
    
    // Teste Zugriff auf profiles mit regulärem Client
    console.log('\nTeste Zugriff auf profiles mit regulärem Client...');
    const { data: regularProfiles, error: regularProfilesError } = await regularClient
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (regularProfilesError) {
      console.log('Regulärer Client kann nicht auf profiles zugreifen:', regularProfilesError.message);
    } else {
      console.log('Regulärer Client kann auf profiles zugreifen:', regularProfiles);
    }
    
  } catch (error) {
    console.error('Fehler beim Testen des RLS-Bypass:', error);
  }
}

testRlsBypass();
