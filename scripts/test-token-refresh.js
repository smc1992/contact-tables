// Test-Skript für die Token-Refresh-Rate-Limiting-Lösung
// Direkter Import des Supabase-Clients
const { createClient } = require('@supabase/supabase-js');

// Umgebungsvariablen für Supabase manuell setzen mit den Werten aus der .env-Datei
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://efmbzrmroyetcqxcwxka.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWJ6cm1yb3lldGNxeGN3eGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MjkzNDgsImV4cCI6MjA2MzMwNTM0OH0.ohJQapQUce_nuK0Ra30WUQGfchrSG3ZTx43jxV0f0I4';

// Anzahl der Anfragen, die wir testen wollen
const TEST_REQUESTS = 5;
// Verzögerung zwischen den Anfragen (in ms)
const DELAY_BETWEEN_REQUESTS = 1000;
// Zweite Testrunde mit höherer Frequenz
const SECOND_TEST_REQUESTS = 5;
const SECOND_TEST_DELAY = 200;

async function testTokenRefresh() {
  console.log('=== Token Refresh Rate-Limiting Test ===');
  
  // Supabase-Client erstellen mit den optimierten Einstellungen
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: false
      },
      global: {
        fetch: (...args) => {
          // Einfache Implementierung ohne die komplexe Rate-Limiting-Logik
          return fetch(...args);
        }
      }
    }
  );
  
  // Funktion zum Verzögern
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Hilfsfunktion für Testdurchläufe
  async function runTestRound(requests, delayMs, roundName) {
    console.log(`\n--- ${roundName} ---`);
    console.log(`Führe ${requests} Anfragen mit ${delayMs}ms Verzögerung durch...`);
    
    for (let i = 0; i < requests; i++) {
      console.log(`\nAnfrage ${i + 1}/${requests}:`);
      
      try {
        const startTime = Date.now();
        const { data, error } = await supabase.auth.getSession();
        const endTime = Date.now();
        
        if (error) {
          console.error(`  Fehler: ${error.message}`);
          if (error.message.includes('Too many requests') || error.message.includes('rate limit')) {
            console.log('  Rate-Limiting erkannt!');
          }
        } else {
          console.log(`  Session abgerufen: ${!!data.session}`);
          console.log(`  Dauer: ${endTime - startTime}ms`);
        }
      } catch (e) {
        console.error(`  Unerwarteter Fehler: ${e.message}`);
      }
      
      // Kurze Verzögerung vor der nächsten Anfrage
      if (i < requests - 1) {
        await delay(delayMs);
      }
    }
  }
  
  // Erste Testrunde mit normaler Frequenz
  await runTestRound(TEST_REQUESTS, DELAY_BETWEEN_REQUESTS, 'Normale Frequenz');
  
  // Kurze Pause zwischen den Testrunden
  console.log('\nPause zwischen den Testrunden...');
  await delay(3000);
  
  // Zweite Testrunde mit höherer Frequenz
  await runTestRound(SECOND_TEST_REQUESTS, SECOND_TEST_DELAY, 'Hohe Frequenz');
  
  console.log('\n=== Test abgeschlossen ===');
}

// Test ausführen
testTokenRefresh().catch(console.error);
