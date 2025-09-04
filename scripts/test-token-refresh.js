// Test-Skript für die Token-Refresh-Rate-Limiting-Lösung
// Korrigierter Import-Pfad für den Supabase-Client
const { createClient } = require('../src/utils/supabase/client');

// Umgebungsvariablen für Supabase manuell setzen mit den Werten aus der .env-Datei
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://efmbzrmroyetcqxcwxka.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWJ6cm1yb3lldGNxeGN3eGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MjkzNDgsImV4cCI6MjA2MzMwNTM0OH0.ohJQapQUce_nuK0Ra30WUQGfchrSG3ZTx43jxV0f0I4';

// Anzahl der Anfragen, die wir testen wollen
const TEST_REQUESTS = 10;
// Verzögerung zwischen den Anfragen (in ms)
const DELAY_BETWEEN_REQUESTS = 500;

async function testTokenRefresh() {
  console.log('=== Token Refresh Rate-Limiting Test ===');
  console.log(`Führe ${TEST_REQUESTS} Anfragen mit ${DELAY_BETWEEN_REQUESTS}ms Verzögerung durch...`);
  
  // Supabase-Client erstellen
  const supabase = createClient();
  
  // Funktion zum Verzögern
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Mehrere getSession-Aufrufe durchführen
  for (let i = 0; i < TEST_REQUESTS; i++) {
    console.log(`\nAnfrage ${i + 1}/${TEST_REQUESTS}:`);
    
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.auth.getSession();
      const endTime = Date.now();
      
      if (error) {
        console.error(`  Fehler: ${error.message}`);
      } else {
        console.log(`  Session abgerufen: ${!!data.session}`);
        console.log(`  Dauer: ${endTime - startTime}ms`);
      }
    } catch (e) {
      console.error(`  Unerwarteter Fehler: ${e.message}`);
    }
    
    // Kurze Verzögerung vor der nächsten Anfrage
    if (i < TEST_REQUESTS - 1) {
      await delay(DELAY_BETWEEN_REQUESTS);
    }
  }
  
  console.log('\n=== Test abgeschlossen ===');
}

// Test ausführen
testTokenRefresh().catch(console.error);
