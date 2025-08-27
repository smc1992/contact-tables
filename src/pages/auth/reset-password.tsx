import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
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

  // Überprüfen, ob wir uns auf der richtigen Seite befinden (nach Klick auf den Link in der E-Mail)
  useEffect(() => {
    // Supabase leitet automatisch zu dieser Seite weiter und fügt die notwendigen Parameter hinzu
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');
    
    if (!accessToken || type !== 'recovery') {
      setStatus({
        type: 'error',
        message: 'Ungültiger oder abgelaufener Link zum Zurücksetzen des Passworts.',
      });
    } else {
      // Session mit dem Token setzen
      auth.getSession().then(({ data }) => {
        if (!data.session) {
          console.log('Setze Session mit Token aus URL');
          // Wenn keine Session existiert, versuchen wir, eine mit dem Token zu erstellen
          const { supabase } = require('../../utils/supabase');
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          }).then(({ error }: { error: any }) => {
            if (error) {
              console.error('Fehler beim Setzen der Session:', error);
              setStatus({
                type: 'error',
                message: 'Fehler bei der Authentifizierung. Bitte versuchen Sie es erneut.',
              });
            }
          });
        }
      });
    }
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
        // Wenn keine Session existiert, versuchen wir es mit dem Token aus der URL
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        
        if (!accessToken) {
          throw new Error('Keine gültige Authentifizierung gefunden. Bitte fordern Sie einen neuen Link zum Zurücksetzen des Passworts an.');
        }
        
        // Session mit dem Token setzen
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: params.get('refresh_token') || ''
        });
        
        if (sessionError) {
          throw sessionError;
        }
      }
      
      // Jetzt sollte eine gültige Session existieren
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
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
              className={`mb-6 p-4 ${
                status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              } rounded-lg`}
            >
              <div className="flex items-center">
                {status.type === 'success' ? (
                  <FiCheck className="mr-2" />
                ) : (
                  <FiAlertCircle className="mr-2" />
                )}
                <p>{status.message}</p>
              </div>
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
