import { useState, FormEvent, useEffect } from 'react';

// Helper function to validate callbackUrl (rudimentary)
// Helper function to validate callbackUrl (now expects relative paths from middleware)
const isValidCallbackUrl = (url: string | string[] | undefined): url is string => {
  if (typeof url !== 'string') return false;
  // Ensure it's a relative path starting with '/' to prevent open redirect.
  // More sophisticated checks can be added if needed (e.g., disallowing '//' or '..').
  return url.startsWith('/');
};
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
// Framer Motion entfernt, um history.replaceState()-Fehler zu beheben
import { FiLogIn, FiMail } from 'react-icons/fi';
// Direkte Verwendung der Supabase-Funktionen
import { supabase, auth } from '../../utils/supabase';
import PasswordInput from '../../components/PasswordInput';

export default function LoginPage() {
  if (typeof window !== 'undefined') {
    console.log('[Login Page - Render] window.location.href:', window.location.href);
    console.log('[Login Page - Render] window.location.search includes cb=test:', window.location.search.includes('cb=test'));
  }
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { callbackUrl, message, error: queryError } = router.query;

  // Benutzertyp-State hinzufügen (CUSTOMER oder RESTAURANT)
  const [loginUserTypeSelection, setLoginUserTypeSelection] = useState<'CUSTOMER' | 'RESTAURANT'>('CUSTOMER');
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (queryError) {
      setError(`Fehler: ${queryError}`);
    }
    if (message) {
      console.log('Message from query params:', message);
    }
  }, [queryError, message]);
  
  useEffect(() => {
    if (!router.isReady) {
      console.log('[Login Page] Router not ready, waiting...');
      return;
    }
    console.log('[Login Page] Router is ready.');
    console.log('[Login Page] window.location.href:', window.location.href);
    console.log('[Login Page] router.asPath:', router.asPath);
    console.log('[Login Page] Current router.query:', router.query);
    console.log('[Login Page] router.query.cb:', router.query.cb);
    console.log('[Login Page] router.asPath includes cb=test:', router.asPath.includes('cb=test'));

    // DIAGNOSTIC: Check for 'cb' query parameter
    const diagnosticCbValue = router.query.cb;
    console.log('[Login Page] diagnosticCbValue from router.query.cb:', diagnosticCbValue);

    if (diagnosticCbValue === 'test') {
      console.log('[Login Page] Diagnostic parameter cb=test FOUND!');
    } else {
      console.log('[Login Page] Diagnostic parameter cb=test NOT found or incorrect.');
    }

    const isRedirectLoop = sessionStorage.getItem('redirectAttempt');
    const storedUserTypeFromSession = sessionStorage.getItem('preferredUserType') as 'CUSTOMER' | 'RESTAURANT' | null;
    if (storedUserTypeFromSession) {
      setLoginUserTypeSelection(storedUserTypeFromSession); // setLoginUserTypeSelection is from useState hook for loginUserTypeSelection selection
      sessionStorage.removeItem('preferredUserType');
    }
    
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Fehler beim Abrufen der Sitzung:', sessionError);
          setLoading(false);
          return;
        }
        
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          const userRole = data.session.user.user_metadata?.data?.role || data.session.user.user_metadata?.role || 'CUSTOMER';
          const userRoleUpper = userRole.toUpperCase();
          
          if (isRedirectLoop) {
            console.log('Weiterleitungsschleife erkannt, bleibe auf der Login-Seite');
            sessionStorage.removeItem('redirectAttempt');
            setLoading(false);
            return;
          }
          
          // Check if loginUserTypeSelection (selected on UI) matches actual role after login
          if (loginUserTypeSelection === 'RESTAURANT' && userRoleUpper !== 'RESTAURANT') {
            setError('Dieses Konto ist kein Restaurant-Konto. Bitte wählen Sie den korrekten Anmeldetyp oder loggen Sie sich als Kunde ein.');
            // await supabase.auth.signOut(); // Optional: Sign out user if role mismatch is critical
            setLoading(false);
            return;
          }
          
          if (loginUserTypeSelection === 'CUSTOMER' && userRoleUpper === 'RESTAURANT') {
            setError('Dieses Konto ist ein Restaurant-Konto. Bitte wählen Sie den korrekten Anmeldetyp oder loggen Sie sich als Restaurant ein.');
            // await supabase.auth.signOut(); // Optional: Sign out user
            setLoading(false);
            return;
          }
          
          // sessionStorage.setItem('redirectAttempt', 'true'); // Do not set for diagnostic if not redirecting
          
          const queryCallbackUrlValueOriginal = router.query.callbackUrl;
          let effectiveCallbackUrlOriginal: string | undefined;
          if (Array.isArray(queryCallbackUrlValueOriginal)) {
            effectiveCallbackUrlOriginal = queryCallbackUrlValueOriginal[0];
          } else if (typeof queryCallbackUrlValueOriginal === 'string') {
            effectiveCallbackUrlOriginal = queryCallbackUrlValueOriginal;
          }
          // Fallback: If router.query.callbackUrl is not available, try to parse from router.asPath
          if (!effectiveCallbackUrlOriginal && router.asPath.includes('?')) {
            const pathParts = router.asPath.split('?');
            if (pathParts.length > 1) {
              const searchParams = new URLSearchParams(pathParts[1]);
              const cbUrlFromAsPath = searchParams.get('callbackUrl');
              if (cbUrlFromAsPath) {
                effectiveCallbackUrlOriginal = cbUrlFromAsPath;
              }
            }
          }

          if (effectiveCallbackUrlOriginal && isValidCallbackUrl(effectiveCallbackUrlOriginal)) {
            console.log(`[Login Page] Original Valid callbackUrl '${effectiveCallbackUrlOriginal}' found, redirecting.`);
            router.push(effectiveCallbackUrlOriginal).catch(err => { 
              console.error('[Login Page] Failed to redirect to callbackUrl:', err);
              router.push('/').catch(e => console.error('[Login Page] Failed to redirect to / on error:', e)); 
            });
            return; 
          } else if (effectiveCallbackUrlOriginal) {
            console.warn(`[Login Page] Original Invalid callbackUrl found: '${effectiveCallbackUrlOriginal}'. Not redirecting.`);
          } else {
            console.log('[Login Page] Original No callbackUrl found or it is invalid. Attempting role-based redirect.');
          }

          // Fallback redirection if no valid effectiveCallbackUrl
          switch (userRoleUpper) { 
            case 'ADMIN':
              router.push('/admin/dashboard'); 
              break;
            case 'RESTAURANT':
              router.push('/restaurant/dashboard'); 
              break;
            default:
              router.push('/customer/dashboard'); 
          }
          setLoading(false); 

        } else { // if (!data.session)
          setLoading(false);
          sessionStorage.removeItem('redirectAttempt'); 
        }
      } catch (e: any) {
        console.error('Unerwarteter Fehler in checkSession:', e);
        setLoading(false);
      }
    };
    
    checkSession();
  }, [router.isReady, router.query, router.asPath, loginUserTypeSelection]);

  // Einfache E-Mail-Validierung - bewusst weniger streng
  const validateEmail = (email: string): boolean => {
    // Wir verwenden eine sehr einfache Validierung: enthält @ und mindestens einen Punkt danach
    return email.includes('@') && email.split('@')[1].includes('.');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      console.log('[Login Page] Anmeldung wird versucht für:', email);
      const { data, error: signInError } = await auth.signIn(email, password);
      
      if (signInError) {
        console.error('[Login Page] Login error:', signInError);
        setError('Ungültige E-Mail oder Passwort.');
        return;
      } 
      
      console.log('[Login Page] Anmeldung erfolgreich, Benutzerdaten:', data?.user ? 'Benutzer vorhanden' : 'Kein Benutzer');
      
      if (data?.user) {
        const userRole = data.user.user_metadata?.data?.role || data.user.user_metadata?.role || 'CUSTOMER';
        const userRoleUpper = userRole.toUpperCase();
        
        if (loginUserTypeSelection === 'RESTAURANT' && userRoleUpper !== 'RESTAURANT') {
          setError('Dieses Konto ist kein Restaurant-Konto. Bitte wählen Sie den korrekten Anmeldetyp.');
          // await supabase.auth.signOut(); // Optional: User ausloggen
          return;
        }
        
        if (loginUserTypeSelection === 'CUSTOMER' && userRoleUpper === 'RESTAURANT') {
          setError('Dieses Konto ist ein Restaurant-Konto. Bitte wählen Sie den korrekten Anmeldetyp.');
          // await supabase.auth.signOut(); // Optional: User ausloggen
          return;
        }
        
        console.log(`[Login Page] Login erfolgreich als ${userRoleUpper}, Weiterleitung...`);
        
        // WICHTIG: Server-Zustand (inkl. Cookies) aktualisieren lassen, bevor weitergeleitet wird.
        // Da wir den Pages Router verwenden, nutzen wir router.replace(router.asPath) anstelle von router.refresh().
        console.log('[Login Page] Aktualisiere Server-Zustand vor der Weiterleitung');
        await router.replace(router.asPath);
        
        // Kurze Verzögerung, um sicherzustellen, dass die Session gesetzt wird
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Überprüfe, ob die Session gesetzt wurde
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('[Login Page] Session nach Login:', sessionData?.session ? 'Session vorhanden' : 'Keine Session');

        if (isValidCallbackUrl(callbackUrl)) {
          console.log(`[Login Page] Gültige callbackUrl gefunden: ${callbackUrl}, Weiterleitung dorthin...`);
          router.push(callbackUrl as string);
        } else {
          // Fallback-Weiterleitung basierend auf Rolle
          console.log(`[Login Page] Keine gültige callbackUrl, Fallback-Weiterleitung basierend auf Rolle ${userRoleUpper}`);
          switch (userRoleUpper) {
            case 'ADMIN':
              console.log('[Login Page] Weiterleitung zum Admin-Dashboard');
              router.push('/admin/dashboard');
              break;
            case 'RESTAURANT':
              console.log('[Login Page] Weiterleitung zum Restaurant-Dashboard');
              router.push('/restaurant/dashboard');
              break;
            default:
              console.log('[Login Page] Weiterleitung zum Kunden-Dashboard');
              router.push('/customer/dashboard');
          }
        }
      }
    } catch (e: any) {
      console.error('Login error:', e);
      setError(`Ein Fehler ist aufgetreten: ${e.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Anmelden
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Oder{' '}
              <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                erstelle ein neues Konto
              </Link>
            </p>
            
            {/* Benutzertyp-Auswahl */}
            <div className="mt-6 flex rounded-md shadow-sm">
              <button
                type="button"
                className={`relative inline-flex items-center w-1/2 px-4 py-2 rounded-l-md border ${loginUserTypeSelection === 'CUSTOMER' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'} text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500`}
                onClick={() => setLoginUserTypeSelection('CUSTOMER')}
              >
                Als Gast anmelden
              </button>
              <button
                type="button"
                className={`relative inline-flex items-center w-1/2 px-4 py-2 rounded-r-md border ${loginUserTypeSelection === 'RESTAURANT' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'} text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500`}
                onClick={() => setLoginUserTypeSelection('RESTAURANT')}
              >
                Als Restaurant anmelden
              </button>
            </div>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Fehler: </strong>
            <span className="block sm:inline">{error}</span>
          </div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  E-Mail-Adresse
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="E-Mail-Adresse"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Passwort
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Angemeldet bleiben
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Passwort vergessen?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <FiMail className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                </span>
                {isSubmitting ? 'Anmeldung läuft...' : 'Anmelden'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}