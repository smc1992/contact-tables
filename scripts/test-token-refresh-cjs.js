// Test-Skript für die Token-Refresh-Rate-Limiting-Lösung (CommonJS-Version)
require('dotenv').config();

// Umgebungsvariablen für Supabase manuell setzen
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://efmbzrmroyetcqxcwxka.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWJ6cm1yb3lldGNxeGN3eGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MjkzNDgsImV4cCI6MjA2MzMwNTM0OH0.ohJQapQUce_nuK0Ra30WUQGfchrSG3ZTx43jxV0f0I4';

// Simulieren des Supabase-Clients für Tests
const mockSupabaseClient = {
  auth: {
    getSession: async () => {
      // Simuliere eine kurze Verzögerung
      await new Promise(resolve => setTimeout(resolve, 100));
      return { 
        data: { session: null },
        error: null
      };
    }
  }
};

// Anzahl der Anfragen, die wir testen wollen
const TEST_REQUESTS = 10;
// Verzögerung zwischen den Anfragen (in ms)
const DELAY_BETWEEN_REQUESTS = 500;

// Funktion zum Verzögern
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simuliere unser Rate-Limiting und Session-Caching
const refreshState = {
  isRefreshing: false,
  lastRefreshTime: 0,
  refreshCount: 0,
  consecutiveErrors: 0,
  backoffTime: 2000, // 2 Sekunden initiale Backoff-Zeit
  lastSessionData: null,
  lastSessionTime: 0,
  pendingPromise: null,
  retryQueue: [],
  isRateLimited: false,
  rateLimitedUntil: 0,
};

// Konfigurationskonstanten
const MIN_REFRESH_INTERVAL = 30000; // 30 Sekunden zwischen Refreshes
const MAX_REFRESH_COUNT = 3; // Maximal 3 Refreshes im Zeitfenster
const REFRESH_COUNT_WINDOW = 120000; // 2 Minuten Zeitfenster
const SESSION_CACHE_DURATION = 60000; // 1 Minute Session-Cache-Dauer

// Verbesserte getSession-Methode mit Rate-Limiting und Caching
async function getSessionWithRateLimiting() {
  const now = Date.now();
  
  // 1. Verwende gecachte Session, wenn sie noch gültig ist
  if (refreshState.lastSessionData && 
      now - refreshState.lastSessionTime < SESSION_CACHE_DURATION) {
    console.log('Verwende gecachte Session (Cache-Alter: ' + 
               Math.round((now - refreshState.lastSessionTime)/1000) + 's)');
    return refreshState.lastSessionData;
  }
  
  // 2. Anfrage-Koaleszenz: Wenn bereits eine Anfrage läuft, warte auf deren Ergebnis
  if (refreshState.pendingPromise) {
    console.log('Anfrage-Koaleszenz: Verwende bereits laufende Session-Anfrage');
    return refreshState.pendingPromise;
  }
  
  // 3. Rate-Limiting: Prüfe, ob wir zu viele Refreshes in kurzer Zeit durchführen
  if (refreshState.isRateLimited) {
    console.warn('Rate-Limit aktiv, verwende gecachte Session oder warte');
    
    if (refreshState.lastSessionData) {
      return refreshState.lastSessionData;
    }
    
    // Warte auf das Ende des Rate-Limits
    const waitTime = Math.min(refreshState.rateLimitedUntil - now, 300000); // max 5 Minuten
    if (waitTime > 0) {
      console.log(`Warte ${Math.ceil(waitTime/1000)}s vor dem nächsten Versuch...`);
      await delay(waitTime);
    }
  }
  
  // 4. Prüfe auf zu häufige Anfragen im Zeitfenster
  if (now - refreshState.lastRefreshTime < REFRESH_COUNT_WINDOW) {
    refreshState.refreshCount++;
    
    if (refreshState.refreshCount > MAX_REFRESH_COUNT) {
      console.warn(`Zu viele Token-Refreshes (${refreshState.refreshCount}) innerhalb von ${REFRESH_COUNT_WINDOW/1000}s`);
      
      // Wenn wir das Limit überschritten haben und eine gecachte Session haben, verwende diese
      if (refreshState.lastSessionData) {
        console.log('Verwende gecachte Session aufgrund von Rate-Limiting');
        return refreshState.lastSessionData;
      }
      
      // Exponentielles Backoff anwenden
      const backoffTime = Math.min(
        2000 * Math.pow(1.5, refreshState.refreshCount - MAX_REFRESH_COUNT),
        150000 // max 2.5 Minuten
      );
      
      console.log(`Warte ${Math.ceil(backoffTime/1000)}s vor dem nächsten Versuch...`);
      await delay(backoffTime);
    }
  } else {
    // Zurücksetzen des Zählers, wenn wir außerhalb des Zeitfensters sind
    refreshState.refreshCount = 1;
  }
  
  // 5. Führe die tatsächliche Anfrage durch und speichere sie für Koaleszenz
  try {
    refreshState.lastRefreshTime = now;
    refreshState.pendingPromise = mockSupabaseClient.auth.getSession();
    
    const result = await refreshState.pendingPromise;
    
    // Cache das Ergebnis
    refreshState.lastSessionData = result;
    refreshState.lastSessionTime = Date.now();
    
    return result;
  } catch (error) {
    console.error('Fehler beim Abrufen der Session:', error);
    throw error;
  } finally {
    // Setze pendingPromise zurück, damit neue Anfragen gestellt werden können
    refreshState.pendingPromise = null;
  }
}

async function testTokenRefresh() {
  console.log('=== Token Refresh Rate-Limiting Test ===');
  console.log(`Führe ${TEST_REQUESTS} Anfragen mit ${DELAY_BETWEEN_REQUESTS}ms Verzögerung durch...`);
  
  // Mehrere getSession-Aufrufe durchführen
  for (let i = 0; i < TEST_REQUESTS; i++) {
    console.log(`\nAnfrage ${i + 1}/${TEST_REQUESTS}:`);
    
    try {
      const startTime = Date.now();
      const { data, error } = await getSessionWithRateLimiting();
      const endTime = Date.now();
      
      if (error) {
        console.error(`  Fehler: ${error.message}`);
      } else {
        console.log(`  Session abgerufen: ${!!data.session}`);
        console.log(`  Dauer: ${endTime - startTime}ms`);
        
        // Zeige Cache-Status
        if (i > 0) {
          console.log(`  Cache verwendet? ${endTime - startTime < 50 ? 'Ja' : 'Nein'}`);
        }
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
