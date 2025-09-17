import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../../types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

// Typdefinition für die Session-Rückgabe
type SessionResponse = {
  data: { session: any | null },
  error: any | null
};

/**
 * Debounce-Funktion zur Begrenzung der Häufigkeit von Funktionsaufrufen
 */
function debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<F>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Hilfsfunktion zum Warten
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Konfigurationskonstanten für Rate-Limiting
 */
const MIN_REFRESH_INTERVAL = 120000; // 120 Sekunden (2 Minuten) zwischen Refreshes (erhöht von 60s)
const MAX_REFRESH_COUNT = 1; // Maximal 1 Refresh im Zeitfenster (reduziert von 2)
const REFRESH_COUNT_WINDOW = 300000; // 5 Minuten Zeitfenster (erhöht von 3min)
const SESSION_CACHE_DURATION = 180000; // 3 Minuten Session-Cache-Dauer (erhöht von 2min)
const INITIAL_BACKOFF = 10000; // 10 Sekunden initiale Backoff-Zeit (erhöht von 5s)
const MAX_BACKOFF = 600000; // 10 Minuten maximale Backoff-Zeit (erhöht von 5min)

/**
 * Globaler Status für Token-Refresh-Versuche und Session-Caching
 */
const refreshState = {
  isRefreshing: false,
  lastRefreshTime: 0,
  refreshCount: 0,
  consecutiveErrors: 0,
  backoffTime: INITIAL_BACKOFF,
  lastSessionData: null as SessionResponse | null,
  lastSessionTime: 0,
  pendingPromise: null as Promise<SessionResponse> | null,
  retryQueue: [] as (() => void)[],
  isRateLimited: false,
  rateLimitedUntil: 0,
};

/**
 * Löscht alle zwischengespeicherten Auth-Daten (z.B. nach Logout aufrufen),
 * damit getSession nicht versehentlich eine veraltete Session zurückgibt.
 */
export function clearClientAuthCache() {
  try {
    refreshState.isRefreshing = false;
    refreshState.lastRefreshTime = 0;
    refreshState.refreshCount = 0;
    refreshState.consecutiveErrors = 0;
    refreshState.backoffTime = INITIAL_BACKOFF;
    refreshState.lastSessionData = null;
    refreshState.lastSessionTime = 0;
    refreshState.pendingPromise = null;
    refreshState.retryQueue = [];
    refreshState.isRateLimited = false;
    refreshState.rateLimitedUntil = 0;
    // Optional: kleine Log-Nachricht im Debug
    if (typeof window !== 'undefined') {
      console.log('Auth-Cache im Client geleert.');
    }
  } catch (e) {
    // ignore
  }
}

export function createClient(): SupabaseClient<Database> {
  console.log('Client createClient: Erstelle Browser-Client');
  
  // Debugging: Prüfe, ob die Umgebungsvariablen verfügbar sind
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Client: Supabase URL oder Anon Key fehlen in der Konfiguration.');
  }
  
  // Bestimme, ob wir in Produktion sind und auf welcher Domain
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecureContext = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isCustomDomain = hostname.includes('contact-tables.org');
  const isNetlifyDomain = hostname.includes('netlify.app');
  
  // Cookie-Optionen basierend auf der Umgebung konfigurieren
  const cookieOptions = {
    name: 'contact-tables-auth',
    maxAge: 60 * 60 * 24 * 7, // 7 Tage
    sameSite: 'lax' as 'lax', // Expliziter Typ für TypeScript
    path: '/',
    secure: isProduction || isSecureContext,
  };
  
  // Domain-Einstellung nur für die Haupt-Domain hinzufügen
  if (isProduction && isCustomDomain) {
    console.log('Client: Cookie Domain für .contact-tables.org gesetzt');
    Object.assign(cookieOptions, { domain: '.contact-tables.org' });
  }
  
  // Wir verwenden die globale sleep-Funktion von oben

  // Hilfsfunktion zum Ausführen der Retry-Queue
  const processRetryQueue = async () => {
    if (refreshState.retryQueue.length > 0) {
      console.log(`Verarbeite ${refreshState.retryQueue.length} zurückgestellte Anfragen...`);
      const queue = [...refreshState.retryQueue];
      refreshState.retryQueue = [];
      
      // Verarbeite die Anfragen mit Verzögerung
      for (const retryFn of queue) {
        await sleep(1000); // 1 Sekunde zwischen den Retries
        retryFn();
      }
    }
  };

  /**
   * Benutzerdefinierte Fetch-Funktion mit Rate-Limit-Erkennung und Backoff
   */
  const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      // Prüfe, ob wir aktuell rate-limited sind
      const now = Date.now();
      if (refreshState.isRateLimited && now < refreshState.rateLimitedUntil) {
        const waitTime = refreshState.rateLimitedUntil - now;
        console.warn(`Rate-Limiting aktiv. Warte ${waitTime}ms vor nächstem Versuch.`);
        
        // Füge Anfrage zur Warteschlange hinzu, wenn es sich um eine Token-Refresh-Anfrage handelt
        const inputStr = input.toString();
        if (inputStr.includes('token?grant_type=refresh_token')) {
          return new Promise<Response>((resolve) => {
            refreshState.retryQueue.push(async () => {
              try {
                const response = await fetch(input, init);
                resolve(response);
              } catch (error) {
                console.error('Fehler bei zurückgestellter Anfrage:', error);
                resolve(new Response(JSON.stringify({ error: 'Netzwerkfehler' }), { status: 500 }));
              }
            });
          });
        }
        
        // Für andere Anfragen warten wir kurz und versuchen es dann
        await sleep(Math.min(waitTime, 5000));
      }
      
      // Führe die Anfrage aus
      const response = await fetch(input, init);
      
      // Prüfe auf 429 Too Many Requests
      if (response.status === 429) {
        console.warn('429 Too Many Requests erhalten!');
        
        // Setze Rate-Limiting-Status
        refreshState.isRateLimited = true;
        
        // Erhöhe Backoff-Zeit mit Jitter (zufällige Variation)
        refreshState.backoffTime = Math.min(
          refreshState.backoffTime * 2 * (0.8 + Math.random() * 0.4), // 20% Jitter
          MAX_BACKOFF
        );
        
        // Bestimme Backoff-Zeit aus Header oder verwende berechnete Zeit
        const retryAfter = response.headers.get('Retry-After');
        const retryAfterMs = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : refreshState.backoffTime;
        
        refreshState.rateLimitedUntil = Date.now() + retryAfterMs;
        
        console.warn(`Rate-Limiting aktiv für ${retryAfterMs}ms. Backoff: ${refreshState.backoffTime}ms`);
        
        // Plane die Verarbeitung der Warteschlange nach Ablauf des Rate-Limits
        setTimeout(() => {
          if (refreshState.retryQueue.length > 0) {
            console.log(`Verarbeite ${refreshState.retryQueue.length} zurückgestellte Anfragen...`);
            
            // Kopiere und leere die Warteschlange
            const queue = [...refreshState.retryQueue];
            refreshState.retryQueue = [];
            
            // Setze Rate-Limiting zurück
            refreshState.isRateLimited = false;
            
            // Verarbeite die Warteschlange mit Verzögerung zwischen den Anfragen
            queue.forEach((retry, index) => {
              setTimeout(retry, index * 1000); // 1 Sekunde zwischen Anfragen
            });
          } else {
            // Setze Rate-Limiting zurück, wenn keine Anfragen in der Warteschlange sind
            refreshState.isRateLimited = false;
          }
        }, retryAfterMs);
      } else {
        // Bei erfolgreicher Antwort setzen wir die Backoff-Zeit zurück
        const inputStr = input.toString();
        if (response.ok && !inputStr.includes('token?grant_type=refresh_token')) {
          refreshState.backoffTime = INITIAL_BACKOFF;
          refreshState.consecutiveErrors = 0;
        }
      }
      
      return response;
    } catch (error) {
      console.error('Netzwerkfehler bei Supabase-Anfrage:', error);
      throw error;
    }
  };
  
  // Erstelle den Supabase-Client mit korrekten Typen
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions,
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        fetch: customFetch as typeof fetch
      }
    }
  );
  
  // Registriere den Auth-State-Change-Handler separat
  client.auth.onAuthStateChange(debounce((event, session) => {
    console.log(`[Debounced] Auth state changed: ${event}`, { hasSession: !!session });
  }, 1000));
  
  // Überschreibe die getSession-Methode mit verbessertem Caching und Anfrage-Koaleszenz
  const originalGetSession = client.auth.getSession.bind(client.auth);
  const getSessionWithRateLimiting = async function(): Promise<SessionResponse> {
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
      const waitTime = Math.min(refreshState.rateLimitedUntil - now, MAX_BACKOFF);
      if (waitTime > 0) {
        console.log(`Warte ${Math.ceil(waitTime/1000)}s vor dem nächsten Versuch...`);
        await sleep(waitTime);
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
          INITIAL_BACKOFF * Math.pow(1.5, refreshState.refreshCount - MAX_REFRESH_COUNT),
          MAX_BACKOFF / 2
        );
        
        console.log(`Warte ${Math.ceil(backoffTime/1000)}s vor dem nächsten Versuch...`);
        await sleep(backoffTime);
      }
    } else {
      // Zurücksetzen des Zählers, wenn wir außerhalb des Zeitfensters sind
      refreshState.refreshCount = 1;
    }
    
    // 5. Führe die tatsächliche Anfrage durch und speichere sie für Koaleszenz
    try {
      refreshState.lastRefreshTime = now;
      refreshState.pendingPromise = originalGetSession();
      
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
  };
  
  // Zuweisung der verbesserten getSession-Methode
  client.auth.getSession = getSessionWithRateLimiting as typeof client.auth.getSession;
  
  // Debugging: Session-Status prüfen
  client.auth.getSession().then(({ data }) => {
    console.log('Client createClient: Session vorhanden?', !!data.session);
  }).catch(error => {
    console.error('Client createClient: Fehler beim Abrufen der Session:', error);
  });
  
  return client;
}
