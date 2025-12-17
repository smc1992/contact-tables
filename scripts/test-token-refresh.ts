// Test-Skript für die Token-Refresh-Rate-Limiting-Lösung
import { createClient } from '../src/utils/supabase/client';

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
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
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
    } catch (e: any) {
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
