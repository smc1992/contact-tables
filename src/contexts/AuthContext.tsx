import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabase';
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // Hinzufügen
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialisierung und Sitzungsüberwachung mit Optimierungen zur Vermeidung von zu vielen history.replaceState()-Aufrufen
  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: initialAuthData }) => {
      setSession(initialAuthData.session);
      setUser(initialAuthData.session?.user ?? null);
      setLoading(false);
    }).catch(error => {
      console.error('Fehler beim initialen Abrufen der Sitzung:', error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession);
        setLoading(true); // Beginne Ladevorgang für Auth-Änderung

        if (newSession && newSession.user) {
          console.log('User authenticated:', newSession.user.email);
          console.log('User metadata:', newSession.user.user_metadata);
          console.log('Full user object:', newSession.user); // Logge das gesamte User-Objekt

          let currentUser = newSession.user;
          // Lese die Rolle aus user_metadata.data.role
          const roleFromMetaData = currentUser.user_metadata?.data?.role as string || null;
          console.log('Rolle aus Metadaten gelesen:', roleFromMetaData);
          setUserRole(roleFromMetaData); // Setze die userRole

          /*
          if (!roleFromMetaData) { // Oder eine spezifischere Bedingung
            console.log('Keine Benutzerrolle in Metadaten gefunden, versuche Standardrolle CUSTOMER zu setzen');
            try {
              const { data: updatedUserData, error: updateUserError } = await supabase.auth.updateUser({
                data: { data: { role: 'CUSTOMER' } } // Stelle sicher, dass es in user_metadata.data geschrieben wird
              });
              if (updateUserError) {
                console.error('Fehler beim Aktualisieren der Benutzerrolle:', updateUserError);
              } else if (updatedUserData && updatedUserData.user) {
                console.log('Benutzerrolle erfolgreich auf CUSTOMER gesetzt in Metadaten.');
                currentUser = updatedUserData.user;
                setUserRole('CUSTOMER');
              }
            } catch (error) {
              console.error('Unerwarteter Fehler beim Aktualisieren der Benutzerrolle:', error);
            }
          }
          */
          setSession(newSession);
          setUser(currentUser);
        } else {
          console.log('User is not authenticated or session is null');
          setSession(null);
          setUser(null);
          setUserRole(null); // Rolle zurücksetzen beim Abmelden
        }
        setLoading(false); // Beende Ladevorgang
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Leeres Dependency Array, um sicherzustellen, dass dies nur einmal beim Mounten ausgeführt wird

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
        const { error } = await supabase.auth.signOut();
        return { error };
      } catch (error) {
        return { error };
      }
    },
    resetPassword: async (email: string) => {
      try {
        const result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
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
