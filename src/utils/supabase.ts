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
    // Hier könnten globale Optionen wie 'fetch' oder 'headers' stehen, falls benötigt.
    // Beispiel: 
    // global: {
    //   fetch: (input, init) => customFetch(input, init),
    // },
  }
);

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
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
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
      .eq('id', userId)
      .single();
    return { data, error };
  },
  updateProfile: async (userId: string, profileData: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId);
    return { data, error };
  },
};

// Hilfsfunktionen für Restaurants
export const restaurants = {
  getRestaurantProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', userId)
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
