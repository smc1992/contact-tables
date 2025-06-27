import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { FiUserPlus, FiMail, FiLock, FiUser, FiBriefcase } from 'react-icons/fi'; // FiBriefcase für Restaurant-spezifische Felder
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Benutzertyp-State hinzufügen (CUSTOMER oder RESTAURANT)
  const [userType, setUserType] = useState<'CUSTOMER' | 'RESTAURANT'>('CUSTOMER');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantDescription, setRestaurantDescription] = useState('');
  const router = useRouter();

  const { signUp } = useAuth();
  
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!name || !email || !password || (userType === 'RESTAURANT' && !restaurantName)) {
      setError('Bitte füllen Sie alle Felder aus.');
      setLoading(false);
      return;
    }

    try {
      console.log(`Starte Supabase-Registrierung als ${userType}...`);
      console.log('E-Mail:', email);
      console.log('Name:', name);
      
      // Direkte Verwendung von supabase anstatt AuthContext
      const { supabase } = await import('../../utils/supabase');
      
      // Registrierung mit Benutzermetadaten für die Rolle
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: userType,
            ...(userType === 'RESTAURANT' && {
              restaurant_name: restaurantName,
              restaurant_description: restaurantDescription,
            }),
          }
        }
      });
      
      console.log('Supabase-Antwort:', result);
      
      if (result.error) {
        console.error('Direkter Registrierungsfehler:', result.error);
        setError(`Fehler: ${result.error.message || 'Unbekannter Fehler'}`);
      } else if (result.data?.user) {
        console.log('Registrierung erfolgreich:', result.data.user);
        
        // Nach erfolgreicher Registrierung Benutzerdaten aktualisieren
        try {
          const { data: updateData, error: updateError } = await supabase
            .from('profiles')
            .upsert({
              id: result.data.user.id,
              name,
              role: userType
            });
            
          if (updateError) {
            console.warn('Fehler beim Aktualisieren des Profils:', updateError);
          }
        } catch (profileError) {
          console.warn('Fehler beim Erstellen des Profils:', profileError);
        }
        
        setSuccess('Registrierung erfolgreich!');
        
        // Je nach Benutzertyp unterschiedliche Weiterleitung
        setTimeout(() => {
          if (userType === 'RESTAURANT') {
            console.log('Restaurant-Registrierung erfolgreich, Weiterleitung zur Erfolgsseite...');
            // Restaurant-Benutzer werden zur Registrierungserfolgsseite weitergeleitet
            router.push('/restaurant/registration-success');
          } else {
            console.log('Kunden-Registrierung erfolgreich, Weiterleitung zum Dashboard...');
            // Kunden werden zum Dashboard weitergeleitet
            router.push('/customer/dashboard');
          }
        }, 2000);
      } else {
        setSuccess('Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail, um Ihr Konto zu bestätigen.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Unerwarteter Fehler bei der direkten Supabase-Registrierung:', err);
      setError(`Kritischer Fehler: ${err.message || 'Unbekannter Fehler'}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg"
        >
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Konto erstellen</h2>
            <p className="mt-2 text-sm text-gray-600">
              Erstellen Sie ein Konto, um alle Funktionen zu nutzen
            </p>
            
            {/* Benutzertyp-Auswahl */}
            <div className="mt-6 flex rounded-md shadow-sm">
              <button
                type="button"
                className={`relative inline-flex items-center w-1/2 px-4 py-2 rounded-l-md border ${userType === 'CUSTOMER' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'} text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500`}
                onClick={() => setUserType('CUSTOMER')}
              >
                Als Gast registrieren
              </button>
              <button
                type="button"
                className={`relative inline-flex items-center w-1/2 px-4 py-2 rounded-r-md border ${userType === 'RESTAURANT' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'} text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500`}
                onClick={() => setUserType('RESTAURANT')}
              >
                Als Restaurant registrieren
              </button>
            </div>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Vollständiger Name"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-Mail-Adresse</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="E-Mail-Adresse"
                  />
                </div>
              </div>

              {userType === 'RESTAURANT' && (
                <>
                  <div className="mb-4">
                    <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiBriefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="restaurantName"
                        name="restaurantName"
                        type="text"
                        required={userType === 'RESTAURANT'}
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                        placeholder="Name Ihres Restaurants"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="restaurantDescription" className="block text-sm font-medium text-gray-700 mb-1">Restaurant Beschreibung (optional)</label>
                    <div className="relative">
                      <textarea
                        id="restaurantDescription"
                        name="restaurantDescription"
                        rows={3}
                        // nicht required, da optional
                        value={restaurantDescription}
                        onChange={(e) => setRestaurantDescription(e.target.value)}
                        className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                        placeholder="Kurze Beschreibung Ihres Restaurants"
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Passwort (mindestens 6 Zeichen)"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <FiUserPlus className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
                </span>
                {loading ? 'Registriere...' : 'Registrieren'}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Bereits registriert?{' '}
              <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                Zum Login
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}