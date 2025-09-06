import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient, clearClientAuthCache } from '../utils/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Typdefinitionen für den Auth-Kontext
type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any, error: any }>;
  signInWithGoogle: () => Promise<{ data: any, error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ data: any, error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ data: any, error: any }>;
  handleAuthCallback: (code: string) => Promise<{ error: any, userRole?: string }>;
  userRole: string | null; // Hinzufügen
};

// Auth-Kontext erstellen
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth-Provider-Komponente
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // Hinzufügen
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Hilfsfunktion zum Debounce von Funktionsaufrufen
  const useDebounce = <T extends any[]>(callback: (...args: T) => void, delay: number) => {
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    
    return (...args: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        timeoutRef.current = null;
      }, delay);
    };
  };

  // Status für die Fehlerbehandlung
  const [authErrors, setAuthErrors] = useState<{count: number, lastTime: number}>({count: 0, lastTime: 0});
  
  // Debounced Funktion für Auth-State-Änderungen
  const handleAuthStateChange = useDebounce((event: string, session: Session | null) => {
    console.log(`[AuthContext] Auth state changed. Event: ${event}`, { hasSession: !!session });
    setSession(session);
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    setUserRole(currentUser?.user_metadata?.role || null);
    setLoading(false);
  }, 500); // 500ms Debounce

  // Initialisierung und Sitzungsüberwachung mit Optimierungen zur Vermeidung von zu vielen history.replaceState()-Aufrufen
  useEffect(() => {
    setLoading(true);
    
    // Initialen Session-Status abrufen
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
          // Fehler zählen für Backoff-Strategie
          setAuthErrors(prev => ({
            count: prev.count + 1,
            lastTime: Date.now()
          }));
        } else {
          // Erfolgreicher Abruf, Fehlerzähler zurücksetzen
          setAuthErrors({count: 0, lastTime: 0});
          handleAuthStateChange('INITIAL_SESSION', session);
        }
      } catch (error) {
        console.error("Unexpected error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getInitialSession();

    // Auth-Status-Änderungen abonnieren
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Verwende die debounced Funktion für Auth-State-Änderungen
      handleAuthStateChange(event, session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Authentifizierungsfunktionen
  const value = {
    session,
    user,
    loading,
    userRole, // Hinzufügen
    signIn: async (email: string, password: string) => {
      try {
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { data: result.data, error: result.error };
      } catch (error) {
        return { data: null, error };
      }
    },
    signInWithGoogle: async () => {
      try {
        const result = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        return { data: result.data, error: result.error };
      } catch (error) {
        return { data: null, error };
      }
    },
    signUp: async (email: string, password: string, userData?: any) => {
      try {
        console.log('Registrierung gestartet mit:', { email, userData });
        
        // Versuche die Registrierung mit Supabase
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              ...userData,
              role: userData?.role || 'CUSTOMER', // Standardrolle ist CUSTOMER
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        
        if (result.error) {
          console.error('Supabase Registrierungsfehler:', result.error);
        } else {
          console.log('Registrierung erfolgreich:', result.data);
        }
        
        return { data: result.data, error: result.error };
      } catch (error: any) {
        console.error('Unerwarteter Fehler bei der Registrierung:', error);
        return { 
          data: null, 
          error: {
            message: 'Verbindungsfehler zum Authentifizierungsserver. Bitte versuchen Sie es später erneut.',
            ...error
          } 
        };
      }
    },
    signOut: async () => {
      try {
        // Clientseitig abmelden (entfernt Browser-Cookies/State)
        await supabase.auth.signOut();
      } catch (e) {
        // ignorieren und trotzdem fortfahren
      } finally {
        try { clearClientAuthCache(); } catch {}
        // Serverseitige Abmeldung und Cookie-Invalidierung erzwingen
        if (typeof window !== 'undefined') {
          window.location.assign('/auth/logout');
        }
      }
      return { error: null };
    },
    resetPassword: async (email: string) => {
      try {
        const result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `https://contact-tables.org/auth/reset-password`,
        });
        return { data: result.data, error: result.error };
      } catch (error) {
        return { data: null, error };
      }
    },
    handleAuthCallback: async (code: string) => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          return { error, userRole: undefined };
        }
        
        // Benutzerrolle aus den Metadaten abrufen
        const userRole = data?.session?.user?.user_metadata?.role || 'CUSTOMER';
        return { error: null, userRole };
      } catch (error) {
        return { error, userRole: undefined };
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook für den einfachen Zugriff auf den Auth-Kontext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden');
  }
  return context;
};
