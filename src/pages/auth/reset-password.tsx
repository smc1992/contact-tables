import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Alert } from 'antd';
import Link from 'next/link';
import { FiAlertCircle, FiLock, FiCheck } from 'react-icons/fi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { auth } from '../../utils/supabase';
import PasswordInput from '../../components/PasswordInput';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });
  const router = useRouter();
  
  // Prüfe sofort, ob wir direkt von einer Supabase-URL kommen
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.href.includes('supabase.co/auth/v1/verify')) {
      console.log('Direkte Supabase-URL erkannt, verarbeite Weiterleitung...');
      try {
        const urlObj = new URL(window.location.href);
        const token = urlObj.searchParams.get('token');
        const redirectTo = urlObj.searchParams.get('redirect_to');
        
        if (token && redirectTo) {
          // Füge den Token als Hash-Parameter zur Redirect-URL hinzu
          const redirectUrl = new URL(decodeURIComponent(redirectTo));
          redirectUrl.hash = `access_token=${token}&type=recovery`;
          
          // Direkte Weiterleitung zur eigentlichen Reset-Seite mit dem Token
          window.location.href = redirectUrl.toString();
        }
      } catch (error) {
        console.error('Fehler bei der Verarbeitung der direkten Supabase-URL:', error);
      }
    }
  }, []);

  // Überprüfen, ob wir uns auf der richtigen Seite befinden (nach Klick auf den Link in der E-Mail)
  useEffect(() => {
    const extractTokenFromUrl = () => {
      // Supabase kann Parameter entweder als Query-Parameter oder als Hash-Parameter übergeben
      // Zuerst prüfen wir die Query-Parameter (bei direktem Link-Aufruf)
      let accessToken = router.query.token as string || router.query.access_token as string;
      let refreshToken = router.query.refresh_token as string;
      let type = router.query.type as string;
      
      // Wenn keine Query-Parameter vorhanden sind, prüfen wir den Hash (bei Redirect)
      if (!accessToken) {
        const hash = window.location.hash;
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          accessToken = params.get('access_token') || '';
          refreshToken = params.get('refresh_token') || '';
          type = params.get('type') || '';
        }
      }
      
      // Wenn immer noch kein Token gefunden wurde, prüfen wir den URL-Pfad
      if (!accessToken && window.location.pathname.includes('/verify')) {
        const urlParams = new URLSearchParams(window.location.search);
        accessToken = urlParams.get('token') || '';
        type = urlParams.get('type') || '';
      }

      // Wenn wir direkt von Supabase weitergeleitet wurden, könnte der Token in der ursprünglichen URL sein
      if (!accessToken && window.location.href.includes('redirect_to=')) {
        try {
          // Extrahiere die ursprüngliche URL aus dem redirect_to Parameter
          const fullUrl = window.location.href;
          const redirectMatch = fullUrl.match(/redirect_to=([^&]+)/);
          if (redirectMatch && redirectMatch[1]) {
            const redirectUrl = decodeURIComponent(redirectMatch[1]);
            // Prüfe, ob in der Redirect-URL ein Token enthalten ist
            const redirectParams = new URL(redirectUrl);
            const redirectHash = redirectParams.hash;
            if (redirectHash) {
              const hashParams = new URLSearchParams(redirectHash.substring(1));
              accessToken = hashParams.get('access_token') || '';
              refreshToken = hashParams.get('refresh_token') || '';
              type = hashParams.get('type') || '';
            }
          }
        } catch (error) {
          console.error('Fehler beim Extrahieren des Tokens aus der Redirect-URL:', error);
        }
      }

      // Wenn der Token in der URL als Teil des Pfades ist (Supabase v1 Verify-URL)
      if (!accessToken && window.location.href.includes('supabase.co/auth/v1/verify')) {
        try {
          const urlObj = new URL(window.location.href);
          accessToken = urlObj.searchParams.get('token') || '';
          type = urlObj.searchParams.get('type') || 'recovery';
        } catch (error) {
          console.error('Fehler beim Extrahieren des Tokens aus der Supabase-URL:', error);
        }
      }
      
      console.log('Token gefunden:', !!accessToken, 'Type:', type);
      return { accessToken, refreshToken, type };
    };

    const { accessToken, refreshToken, type } = extractTokenFromUrl();
    
    if (!accessToken || (type !== 'recovery' && type !== 'signup')) {
      setStatus({
        type: 'error',
        message: 'Ungültiger oder abgelaufener Link zum Zurücksetzen des Passworts. Bitte fordern Sie einen neuen Link an.',
      });
      return;
    }
    
    // Session mit dem Token setzen
    const { supabase } = require('../../utils/supabase');
    
    // Wenn wir direkt von der Supabase-Verify-URL kommen, müssen wir anders vorgehen
    if (window.location.href.includes('supabase.co/auth/v1/verify')) {
      console.log('Direkte Weiterleitung von Supabase-Verify-URL erkannt');
      
      try {
        // Extrahiere die Redirect-URL und leite direkt dorthin weiter
        const urlObj = new URL(window.location.href);
        const redirectTo = urlObj.searchParams.get('redirect_to');
        
        if (redirectTo) {
          // Füge den Token als Hash-Parameter zur Redirect-URL hinzu
          const redirectUrl = new URL(decodeURIComponent(redirectTo));
          redirectUrl.hash = `access_token=${accessToken}&type=recovery`;
          
          // Direkte Weiterleitung zur eigentlichen Reset-Seite mit dem Token
          window.location.href = redirectUrl.toString();
          return; // Beende die Ausführung hier, da wir weiterleiten
        }
      } catch (error) {
        console.error('Fehler bei der Verarbeitung der Supabase-Verify-URL:', error);
      }
    }
    
    // Versuchen, die Session mit dem Token zu setzen
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    }).then(({ data, error }: { data: any, error: any }) => {
      if (error) {
        console.error('Fehler beim Setzen der Session:', error);
        
        // Prüfen, ob der Token abgelaufen ist
        if (error.message && (error.message.includes('expired') || error.message.includes('invalid'))) {
          setStatus({
            type: 'error',
            message: 'Der Link zum Zurücksetzen des Passworts ist abgelaufen. Bitte fordern Sie einen neuen Link an.',
          });
        } else {
          setStatus({
            type: 'error',
            message: 'Fehler bei der Authentifizierung. Bitte versuchen Sie es erneut oder fordern Sie einen neuen Link an.',
          });
        }
      } else {
        console.log('Session erfolgreich gesetzt');
      }
    });
  }, [router.query]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      // Passwörter überprüfen
      if (password !== confirmPassword) {
        throw new Error('Die Passwörter stimmen nicht überein');
      }

      if (password.length < 8) {
        throw new Error('Das Passwort muss mindestens 8 Zeichen lang sein');
      }

      // Passwort aktualisieren
      const { supabase } = require('../../utils/supabase');
      
      // Prüfen, ob eine Session existiert
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        // Nutze die gleiche Token-Extraktionsfunktion wie im useEffect
        const extractTokenFromUrl = () => {
          // Supabase kann Parameter entweder als Query-Parameter oder als Hash-Parameter übergeben
          // Zuerst prüfen wir die Query-Parameter (bei direktem Link-Aufruf)
          let accessToken = router.query.token as string || router.query.access_token as string;
          let refreshToken = router.query.refresh_token as string;
          let type = router.query.type as string;
          
          // Wenn keine Query-Parameter vorhanden sind, prüfen wir den Hash (bei Redirect)
          if (!accessToken) {
            const hash = window.location.hash;
            if (hash) {
              const params = new URLSearchParams(hash.substring(1));
              accessToken = params.get('access_token') || '';
              refreshToken = params.get('refresh_token') || '';
              type = params.get('type') || '';
            }
          }
          
          // Wenn immer noch kein Token gefunden wurde, prüfen wir den URL-Pfad
          if (!accessToken && window.location.pathname.includes('/verify')) {
            const urlParams = new URLSearchParams(window.location.search);
            accessToken = urlParams.get('token') || '';
            type = urlParams.get('type') || '';
          }

          // Wenn wir direkt von Supabase weitergeleitet wurden, könnte der Token in der ursprünglichen URL sein
          if (!accessToken && window.location.href.includes('redirect_to=')) {
            try {
              // Extrahiere die ursprüngliche URL aus dem redirect_to Parameter
              const fullUrl = window.location.href;
              const redirectMatch = fullUrl.match(/redirect_to=([^&]+)/);
              if (redirectMatch && redirectMatch[1]) {
                const redirectUrl = decodeURIComponent(redirectMatch[1]);
                // Prüfe, ob in der Redirect-URL ein Token enthalten ist
                const redirectParams = new URL(redirectUrl);
                const redirectHash = redirectParams.hash;
                if (redirectHash) {
                  const hashParams = new URLSearchParams(redirectHash.substring(1));
                  accessToken = hashParams.get('access_token') || '';
                  refreshToken = hashParams.get('refresh_token') || '';
                  type = hashParams.get('type') || '';
                }
              }
            } catch (error) {
              console.error('Fehler beim Extrahieren des Tokens aus der Redirect-URL:', error);
            }
          }

          // Wenn der Token in der URL als Teil des Pfades ist (Supabase v1 Verify-URL)
          if (!accessToken && window.location.href.includes('supabase.co/auth/v1/verify')) {
            try {
              const urlObj = new URL(window.location.href);
              accessToken = urlObj.searchParams.get('token') || '';
              type = urlObj.searchParams.get('type') || 'recovery';
            } catch (error) {
              console.error('Fehler beim Extrahieren des Tokens aus der Supabase-URL:', error);
            }
          }
          
          console.log('Token gefunden in handlePasswordReset:', !!accessToken);
          return { accessToken, refreshToken, type };
        };

        const { accessToken, refreshToken } = extractTokenFromUrl();
        
        if (!accessToken) {
          throw new Error('Keine gültige Authentifizierung gefunden. Bitte fordern Sie einen neuen Link zum Zurücksetzen des Passworts an.');
        }
        
        // Session mit dem Token setzen
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });
        
        if (sessionError) {
          console.error('Fehler beim Setzen der Session:', sessionError);
          if (sessionError.message && (sessionError.message.includes('expired') || sessionError.message.includes('invalid'))) {
            throw new Error('Der Link zum Zurücksetzen des Passworts ist abgelaufen. Bitte fordern Sie einen neuen Link an.');
          }
          throw sessionError;
        }
      }
      
      // Jetzt sollte eine gültige Session existieren
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        console.error('Fehler beim Aktualisieren des Passworts:', error);
        if (error.message && (error.message.includes('expired') || error.message.includes('invalid'))) {
          throw new Error('Der Link zum Zurücksetzen des Passworts ist abgelaufen. Bitte fordern Sie einen neuen Link an.');
        }
        throw error;
      }

      setStatus({
        type: 'success',
        message: 'Ihr Passwort wurde erfolgreich aktualisiert.',
      });

      // Nach erfolgreicher Aktualisierung zur Login-Seite weiterleiten
      setTimeout(() => {
        // Prüfen, ob es sich um einen Restaurant-Benutzer handelt
        const { supabase } = require('../../utils/supabase');
        supabase.auth.getUser().then(({ data }: { data: any }) => {
          const role = data?.user?.user_metadata?.role;
          if (role === 'RESTAURANT') {
            router.push('/restaurant/login');
          } else {
            router.push('/auth/login');
          }
        });
      }, 2000);
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Passworts:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <main className="pt-20 px-4 md:px-8 pb-12">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Neues Passwort festlegen</h1>
            <p className="text-gray-600 mt-2">
              Bitte geben Sie Ihr neues Passwort ein
            </p>
          </div>
          
          {status.type && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              {status.type === 'error' ? (
                <>
                  <Alert
                    message="Fehler"
                    description={status.message}
                    type="error"
                    showIcon
                    style={{ marginBottom: '20px' }}
                  />
                  {(status.message.includes('abgelaufen') || status.message.includes('ungültig')) && (
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                      <Link href="/auth/forgot-password">
                        <span style={{ color: '#1890ff', cursor: 'pointer' }}>Neuen Link zum Zurücksetzen des Passworts anfordern</span>
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <Alert
                  message="Erfolg"
                  description={status.message}
                  type="success"
                  showIcon
                  style={{ marginBottom: '20px' }}
                />
              )}
            </motion.div>
          )}
          
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Neues Passwort
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <div className="pl-10">
                  <PasswordInput
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Mindestens 8 Zeichen"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort bestätigen
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <div className="pl-10">
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Passwort wiederholen"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Wird aktualisiert...
                  </span>
                ) : (
                  'Passwort aktualisieren'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
