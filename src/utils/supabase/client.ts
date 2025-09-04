import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../../types/supabase';

// Debounce-Funktion zur Begrenzung der Häufigkeit von Funktionsaufrufen
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

// Globaler Status für Token-Refresh-Versuche
const refreshState = {
  isRefreshing: false,
  lastRefreshTime: 0,
  refreshCount: 0,
  consecutiveErrors: 0,
  backoffTime: 1000, // Anfängliche Backoff-Zeit in ms
};

// Minimale Zeit zwischen Token-Refreshes (in ms)
const MIN_REFRESH_INTERVAL = 10000; // 10 Sekunden
// Maximale Anzahl von Refreshes in einem kurzen Zeitraum
const MAX_REFRESH_COUNT = 5;
// Zeitfenster für die Zählung der Refreshes (in ms)
const REFRESH_COUNT_WINDOW = 60000; // 1 Minute

export function createClient() {
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
  
  // Benutzerdefinierte Fetch-Funktion mit Rate-Limiting-Erkennung
  const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const response = await fetch(input, init);
      
      // Überprüfe auf Rate-Limiting-Fehler (429)
      if (response.status === 429) {
        console.warn('Supabase API Rate-Limit erreicht. Verlangsame Anfragen.');
        
        // Erhöhe die Backoff-Zeit exponentiell
        refreshState.consecutiveErrors++;
        refreshState.backoffTime = Math.min(refreshState.backoffTime * 2, 60000); // Max 1 Minute
        
        // Extrahiere Retry-After-Header, falls vorhanden
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          const retrySeconds = parseInt(retryAfter, 10) || 30;
          console.log(`Rate-Limit: Retry-After Header empfangen: ${retrySeconds} Sekunden`);
        }
      } else {
        // Zurücksetzen der Fehler-Counter bei erfolgreichen Anfragen
        if (refreshState.consecutiveErrors > 0) {
          refreshState.consecutiveErrors = 0;
          refreshState.backoffTime = 1000; // Zurücksetzen auf Anfangswert
        }
      }
      
      return response;
    } catch (error) {
      console.error('Netzwerkfehler bei Supabase-Anfrage:', error);
      throw error;
    }
  };
  
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions,
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        // Benutzerdefinierte onAuthStateChange-Funktion
        onAuthStateChange: debounce((event, session) => {
          console.log(`[Debounced] Auth state changed: ${event}`, { hasSession: !!session });
        }, 1000) // 1 Sekunde Debounce
      },
      global: {
        fetch: customFetch
      }
    }
  );
  
  // Überschreibe die getSession-Methode, um Rate-Limiting zu verhindern
  const originalGetSession = client.auth.getSession.bind(client.auth);
  client.auth.getSession = async function() {
    const now = Date.now();
    
    // Prüfe, ob wir zu viele Refreshes in kurzer Zeit durchführen
    if (now - refreshState.lastRefreshTime < MIN_REFRESH_INTERVAL) {
      console.log('Token-Refresh zu häufig angefordert, verwende gecachte Session');
      return await originalGetSession();
    }
    
    // Prüfe, ob wir das Limit für Refreshes im Zeitfenster erreicht haben
    if (now - refreshState.lastRefreshTime < REFRESH_COUNT_WINDOW) {
      refreshState.refreshCount++;
      if (refreshState.refreshCount > MAX_REFRESH_COUNT) {
        console.warn(`Zu viele Token-Refreshes (${refreshState.refreshCount}) innerhalb von ${REFRESH_COUNT_WINDOW/1000} Sekunden`);
        // Warte, bevor wir fortfahren, wenn zu viele Refreshes
        if (refreshState.consecutiveErrors > 0) {
          console.log(`Warte ${refreshState.backoffTime}ms vor dem nächsten Versuch...`);
          await new Promise(resolve => setTimeout(resolve, refreshState.backoffTime));
        }
      }
    } else {
      // Zurücksetzen des Zählers, wenn wir außerhalb des Zeitfensters sind
      refreshState.refreshCount = 1;
    }
    
    refreshState.lastRefreshTime = now;
    return await originalGetSession();
  };
  
  // Debugging: Session-Status prüfen
  client.auth.getSession().then(({ data }) => {
    console.log('Client createClient: Session vorhanden?', !!data.session);
  }).catch(error => {
    console.error('Client createClient: Fehler beim Abrufen der Session:', error);
  });
  
  return client;
}
