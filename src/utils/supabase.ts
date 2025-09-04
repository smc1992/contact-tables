import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../types/supabase'; // Stellt sicher, dass der Pfad zu deinen Typen korrekt ist

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  if (!supabaseUrl) {
    console.warn('Client: NEXT_PUBLIC_SUPABASE_URL ist nicht in den Umgebungsvariablen gesetzt.');
  }
  if (!supabaseAnonKey) {
    console.warn('Client: NEXT_PUBLIC_SUPABASE_ANON_KEY ist nicht in den Umgebungsvariablen gesetzt.');
  }
  if (supabaseUrl && supabaseAnonKey) {
    console.log(
      'Client: createBrowserClient wird NEXT_PUBLIC_SUPABASE_URL und ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY aus den Umgebungsvariablen verwenden.'
    );
  }
}

// Stelle sicher, dass URL und Key vorhanden sind, bevor der Client erstellt wird.
// createBrowserClient wirft einen Fehler, wenn sie fehlen.
if (!supabaseUrl || !supabaseAnonKey) {
  // Im Entwicklungsmodus haben wir bereits gewarnt. Im Produktionsmodus ist dies ein kritischer Fehler.
  // Du könntest hier einen spezifischeren Fehler werfen oder eine Fallback-Logik implementieren,
  // aber für den Client ist es oft am besten, wenn die App mit einer klaren Fehlermeldung fehlschlägt,
  // wenn die Konfiguration fehlt.
  if (!isDevelopment) {
    console.error('Kritischer Fehler: Supabase URL oder Anon Key fehlen in der Client-Konfiguration.');
  }
  // Um TypeScript zufriedenzustellen und einen definierten Export zu haben, auch wenn er nicht funktioniert:
  // @ts-ignore - Erlaube die Erstellung mit potenziell undefinierten Werten, um den Build nicht zu blockieren,
  // aber die Laufzeitfehler werden auftreten.
  // Alternativ: throw new Error('Supabase config missing'); aber das stoppt das Laden des Moduls.
}

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

export const supabase = createBrowserClient<Database>(
  supabaseUrl!,
  supabaseAnonKey!,
  {
    auth: {
      storageKey: 'contact-tables-auth', // Deine benutzerdefinierte Storage Key
      persistSession: true,             // Standard für SSR-Client
      autoRefreshToken: true,           // Standard für SSR-Client
      detectSessionInUrl: true,         // Wichtig für OAuth-Flows
    },
    global: {
      fetch: customFetch
    },
  }
);

// Debounced Auth State Change Handler separat hinzufügen
const debouncedAuthStateHandler = debounce((event: string, session: any) => {
  console.log(`[Debounced] Auth state changed: ${event}`, { hasSession: !!session });
}, 1000);

// Auth State Change Event abonnieren
supabase.auth.onAuthStateChange((event, session) => {
  debouncedAuthStateHandler(event, session);
});

// Original getSession-Methode speichern
const originalGetSession = supabase.auth.getSession.bind(supabase.auth);

// getSession-Methode überschreiben, um Rate-Limiting zu verhindern
supabase.auth.getSession = async function() {
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

// Die Hilfsfunktionen bleiben gleich, da sie die exportierte `supabase`-Instanz verwenden.

if (isDevelopment && supabaseUrl && supabaseAnonKey) {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.warn('Supabase-Verbindungstest (nach Init) fehlgeschlagen:', error.message);
    } else {
      console.log('Supabase-Verbindungstest (nach Init) erfolgreich hergestellt!');
    }
  });
}

// Hilfsfunktionen für die Authentifizierung
export const auth = {
  signUp: async (email: string, password: string, userData: any = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...userData,
          role: userData.role || 'CUSTOMER',
        },
      },
    });
    return { data, error };
  },
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },
  signInWithGoogle: async (options?: { redirectTo?: string }) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: options?.redirectTo || `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    });
    return { data, error };
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://contact-tables.org/auth/reset-password`,
    });
    return { data, error };
  },
  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    return { data, error };
  },
};

// Hilfsfunktionen für Benutzerprofile
export const profiles = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId as any)
      .single();
    return { data, error };
  },
  updateProfile: async (userId: string, profileData: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId as any);
    return { data, error };
  },
};

// Hilfsfunktionen für Restaurants
export const restaurants = {
  getRestaurantProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', userId as any)
      .single();
    return { data, error };
  },
};

// Hilfsfunktionen für Administratoren
export const admin = {
  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    return { data, error };
  },
};
