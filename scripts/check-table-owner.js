// Skript zur Überprüfung des Tabelleneigentümers und der RLS-Richtlinien
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

async function checkTableOwner() {
  console.log('=== Überprüfung des Tabelleneigentümers und der RLS-Richtlinien ===');
  
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
    
    // Führe SQL-Abfrage aus, um Tabelleneigentümer zu überprüfen
    console.log('\nÜberprüfe Tabelleneigentümer...');
    const { data: tableOwners, error: tableOwnersError } = await adminClient.rpc('execute_sql', {
      sql: `
        SELECT 
          t.table_name, 
          t.table_schema,
          t.table_owner,
          (SELECT rolname FROM pg_roles WHERE oid = t.tableowner) AS owner_role_name
        FROM 
          pg_tables t 
        WHERE 
          t.table_schema = 'public' 
          AND t.table_name IN ('email_campaigns', 'profiles')
        ORDER BY 
          t.table_schema, t.table_name;
      `
    });
    
    if (tableOwnersError) {
      console.log('Fehler beim Abrufen der Tabelleneigentümer:', tableOwnersError.message);
      
      // Versuche alternative Methode mit direkter SQL-Abfrage
      console.log('\nVersuche alternative Methode...');
      const { data: altData, error: altError } = await adminClient.from('pg_tables')
        .select('table_name, table_schema, table_owner')
        .eq('table_schema', 'public')
        .in('table_name', ['email_campaigns', 'profiles']);
      
      if (altError) {
        console.log('Alternative Methode fehlgeschlagen:', altError.message);
      } else {
        console.log('Tabelleneigentümer (alternative Methode):', altData);
      }
    } else {
      console.log('Tabelleneigentümer:', tableOwners);
    }
    
    // Überprüfe RLS-Richtlinien
    console.log('\nÜberprüfe RLS-Richtlinien...');
    const { data: rlsPolicies, error: rlsPoliciesError } = await adminClient.rpc('execute_sql', {
      sql: `
        SELECT 
          schemaname, 
          tablename, 
          policyname, 
          roles, 
          cmd, 
          qual, 
          with_check
        FROM 
          pg_policies 
        WHERE 
          schemaname = 'public' 
          AND tablename IN ('email_campaigns', 'profiles')
        ORDER BY 
          schemaname, tablename, policyname;
      `
    });
    
    if (rlsPoliciesError) {
      console.log('Fehler beim Abrufen der RLS-Richtlinien:', rlsPoliciesError.message);
      
      // Versuche alternative Methode
      console.log('\nVersuche alternative Methode für RLS-Richtlinien...');
      const { data: altRlsData, error: altRlsError } = await adminClient.from('pg_catalog.pg_policies')
        .select('*')
        .eq('schemaname', 'public')
        .in('tablename', ['email_campaigns', 'profiles']);
      
      if (altRlsError) {
        console.log('Alternative RLS-Methode fehlgeschlagen:', altRlsError.message);
      } else {
        console.log('RLS-Richtlinien (alternative Methode):', altRlsData);
      }
    } else {
      console.log('RLS-Richtlinien:', rlsPolicies);
    }
    
    // Überprüfe, ob RLS aktiviert ist
    console.log('\nÜberprüfe, ob RLS aktiviert ist...');
    const { data: rlsEnabled, error: rlsEnabledError } = await adminClient.rpc('execute_sql', {
      sql: `
        SELECT 
          c.relname as table_name, 
          CASE WHEN c.relrowsecurity THEN 'RLS aktiviert' ELSE 'RLS deaktiviert' END as rls_status
        FROM 
          pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE 
          n.nspname = 'public'
          AND c.relname IN ('email_campaigns', 'profiles')
          AND c.relkind = 'r';
      `
    });
    
    if (rlsEnabledError) {
      console.log('Fehler beim Überprüfen des RLS-Status:', rlsEnabledError.message);
    } else {
      console.log('RLS-Status:', rlsEnabled);
    }
    
    // Überprüfe Berechtigungen für die Tabellen
    console.log('\nÜberprüfe Tabellenberechtigungen...');
    const { data: tablePermissions, error: tablePermissionsError } = await adminClient.rpc('execute_sql', {
      sql: `
        SELECT 
          grantee, 
          table_schema, 
          table_name, 
          privilege_type
        FROM 
          information_schema.role_table_grants
        WHERE 
          table_schema = 'public'
          AND table_name IN ('email_campaigns', 'profiles')
        ORDER BY 
          table_schema, table_name, grantee, privilege_type;
      `
    });
    
    if (tablePermissionsError) {
      console.log('Fehler beim Abrufen der Tabellenberechtigungen:', tablePermissionsError.message);
    } else {
      console.log('Tabellenberechtigungen:', tablePermissions);
    }
    
  } catch (error) {
    console.error('Fehler bei der Überprüfung:', error);
  }
}

checkTableOwner();
