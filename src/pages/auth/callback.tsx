import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const { handleAuthCallback } = useAuth();

  useEffect(() => {
    const { code } = router.query;

    if (code) {
      // Exchange the auth code for a session using the AuthContext
      handleAuthCallback(code as string)
        .then(({ error, userRole }) => {
          if (error) {
            console.error('Fehler beim Austausch des Auth-Codes:', error);
            router.push('/auth/login?error=auth_callback_error');
          } else {
            // Überprüfen der Benutzerrolle und entsprechende Weiterleitung
            const roleUpper = userRole?.toUpperCase() || 'CUSTOMER';
            console.log('OAuth Callback - Benutzerrolle erkannt:', roleUpper);
            
            // Setzen eines Flags, um Weiterleitungsschleifen zu verhindern
            sessionStorage.removeItem('redirectAttempt');
            
            switch (roleUpper) {
              case 'ADMIN':
                console.log('Admin-Benutzer erkannt, Weiterleitung zum Admin-Dashboard...');
                router.push('/admin/dashboard');
                break;
              case 'RESTAURANT':
                console.log('Restaurant-Benutzer erkannt, Weiterleitung zum Restaurant-Dashboard...');
                router.push('/restaurant/dashboard');
                break;
              default:
                console.log('Kunden-Benutzer erkannt, Weiterleitung zum Kunden-Dashboard...');
                router.push('/customer/dashboard'); // Kunden zum Kunden-Dashboard weiterleiten
            }
          }
        });
    }
  }, [router.query, router, handleAuthCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Authentifizierung läuft...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
      </div>
    </div>
  );
}
