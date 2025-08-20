import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiLogIn, FiMail, FiLock } from 'react-icons/fi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { supabase, auth } from '../../utils/supabase';
import PasswordInput from '../../components/PasswordInput';

export default function RestaurantLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verzögerung hinzufügen, um zu viele Anfragen zu vermeiden
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        throw error;
      }

      if (data && data.user) {
        // Prüfen, ob der Benutzer ein Restaurant ist
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, status')
          .eq('user_id', data.user.id)
          .single();

        if (restaurantError && restaurantError.code !== 'PGRST116') {
          // PGRST116 bedeutet "Kein Datensatz gefunden"
          console.error('Fehler beim Abrufen des Restaurant-Profils:', restaurantError);
          throw new Error('Fehler beim Abrufen des Restaurant-Profils');
        }

        if (!restaurantData) {
          // Benutzer ist kein Restaurant
          await auth.signOut();
          throw new Error('Sie haben keinen Zugriff auf das Restaurant-Dashboard. Bitte registrieren Sie sich als Restaurant.');
        }

        // Erfolgreich eingeloggt und als Restaurant identifiziert
        // Verwende window.location statt router.push, um Probleme mit history.replaceState zu vermeiden
        // Verzögerung hinzufügen, um sicherzustellen, dass die Authentifizierung abgeschlossen ist
        setTimeout(() => {
          window.location.href = '/restaurant/dashboard';
        }, 500);
        return; // Frühzeitiger Return, um weitere Ausführung zu verhindern
      }
    } catch (error: any) {
      console.error('Login-Fehler:', error);
      setError(error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
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
            <h1 className="text-3xl font-bold text-gray-800">Restaurant Login</h1>
            <p className="text-gray-600 mt-2">
              Melden Sie sich an, um Ihr Restaurant zu verwalten
            </p>
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg"
            >
              <div className="flex items-center">
                <FiAlertCircle className="mr-2" />
                <p>{error}</p>
              </div>
            </motion.div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="ihre-email@beispiel.de"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <div className="pl-10">
                  <PasswordInput
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="text-right mt-2">
                <Link href="/restaurant/reset-password" className="text-sm text-primary-600 hover:text-primary-500">
                  Passwort vergessen?
                </Link>
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
                    Anmeldung...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FiLogIn className="mr-2" />
                    Anmelden
                  </span>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Noch kein Restaurant-Konto?{' '}
              <Link href="/restaurant/register" className="text-primary-600 hover:text-primary-500 font-medium">
                Jetzt registrieren
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
