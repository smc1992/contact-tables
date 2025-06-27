import { useRouter } from 'next/router';
import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

type RouteGuardProps = {
  children: ReactNode;
  allowedRoles: string[];
};

/**
 * Komponente zum Schutz von Routen vor unbefugtem Zugriff.
 * Leitet Benutzer zur Login-Seite weiter, wenn sie nicht authentifiziert sind,
 * oder zur Startseite, wenn sie nicht die erforderliche Rolle haben.
 */
export default function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Überprüfe die Authentifizierung, wenn sich die Session ändert
    if (!authLoading) {
      authCheck();
    }

    // Ereignisabonnement für Routenwechsel
    const hideContent = () => {
      setAuthorized(false);
      setLoading(true);
    };

    router.events.on('routeChangeStart', hideContent);
    router.events.on('routeChangeComplete', authCheck);

    return () => {
      router.events.off('routeChangeStart', hideContent);
      router.events.off('routeChangeComplete', authCheck);
    };
  }, [authLoading, session, user]);

  const authCheck = () => {
    // Wenn nicht authentifiziert, zur Login-Seite weiterleiten
    if (!session || !user) {
      console.log('Nicht authentifiziert, leite zur Login-Seite weiter');
      router.push({
        pathname: '/auth/login',
        query: { returnUrl: router.asPath }
      });
      setAuthorized(false);
      setLoading(false);
      return;
    }

    // Wenn authentifiziert, aber nicht die richtige Rolle, zur Startseite weiterleiten
    if (session && session.user && !allowedRoles.includes(session.user.role as string)) {
      console.log(`Benutzer hat Rolle ${session.user.role}, benötigt aber eine der folgenden: ${allowedRoles.join(', ')}`);
      router.push('/');
      setAuthorized(false);
      setLoading(false);
      return;
    }

    // Wenn authentifiziert und die richtige Rolle, Zugriff gewähren
    const userRole = user?.user_metadata?.role || 'CUSTOMER';
    if (session && user && allowedRoles.includes(userRole)) {
      console.log(`Zugriff gewährt für Benutzer mit Rolle ${userRole}`);
      setAuthorized(true);
      setLoading(false);
      return;
    }

    // Wenn noch im Ladevorgang, warten
    if (authLoading) {
      console.log('Session wird geladen...');
      setLoading(true);
      return;
    }
  };

  // Lade-Indikator anzeigen, während die Authentifizierung überprüft wird
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-lg">Authentifizierung wird überprüft...</p>
          </div>
        </main>
      </div>
    );
  }

  // Inhalt nur anzeigen, wenn autorisiert
  return authorized ? <>{children}</> : null;
}
