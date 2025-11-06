import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { FiUserPlus, FiMail, FiLock, FiUser } from 'react-icons/fi';
import { createBrowserClient } from '@supabase/ssr';
import PasswordInput from '../../components/PasswordInput';
import EmailVerificationPopup from '../../components/EmailVerificationPopup';
import RestaurantRegisterForm from '../../components/RestaurantRegisterForm';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'RESTAURANT'>('CUSTOMER');
  const router = useRouter();

  // Konsistente Supabase-Client-Initialisierung
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!firstName || !lastName || !email || !password) {
      setError('Bitte füllen Sie alle Felder aus.');
      setLoading(false);
      return;
    }

    try {
      // Schritt 1: Einheitliche API für die Benutzer-Registrierung aufrufen
      const response = await fetch('/api/auth/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          restaurantName: `${firstName} ${lastName}`, // Für Gäste verwenden wir den Namen als Restaurant-Name
          role: 'CUSTOMER' // Immer als Gast registrieren
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Spezifische Fehlermeldung für bereits existierende Benutzer
        if (response.status === 409) {
          throw new Error(errorData.details || 'Ein Benutzer mit dieser E-Mail-Adresse ist bereits registriert.');
        }
        
        throw new Error(errorData.details || errorData.error || 'Fehler bei der Registrierung.');
      }
      
      // Nach erfolgreicher Registrierung eine Erfolgsmeldung anzeigen
      setSuccess('Registrierung erfolgreich! Bitte überprüfen Sie Ihren E-Mail-Posteingang und bestätigen Sie Ihre E-Mail-Adresse, um fortzufahren.');
      // Kein automatischer Anmeldeversuch mehr, da E-Mail-Bestätigung erforderlich ist
      
      // E-Mail-Adresse speichern und Popup anzeigen
      setRegisteredEmail(email);
      setShowVerificationPopup(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Sicherer Redirect nach erfolgreichem Login
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user.user_metadata.role === 'CUSTOMER') {
        // Leitet zur Startseite weiter, die Middleware kümmert sich um den Rest
        router.push('/customer/dashboard'); 
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

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
              Registrieren Sie sich als Gast, um Tische zu reservieren.
            </p>
          </div>
          
          {/* Tabs Switcher: Gast / Restaurant */}
          <div className="flex justify-center mt-2">
            <div className="inline-flex rounded-md shadow-sm border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveTab('CUSTOMER')}
                className={`${activeTab === 'CUSTOMER' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'} px-4 py-2 text-sm font-medium focus:outline-none`}
              >
                Gast
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('RESTAURANT')}
                className={`${activeTab === 'RESTAURANT' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'} px-4 py-2 text-sm font-medium border-l border-gray-200 focus:outline-none`}
              >
                Restaurant
              </button>
            </div>
          </div>
          
          {activeTab === 'CUSTOMER' ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Vorname"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Nachname"
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
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="pl-10">
                    <PasswordInput
                      id="password"
                      name="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none relative block w-full border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                      placeholder="Passwort (mindestens 6 Zeichen)"
                    />
                  </div>
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
          ) : (
            <div className="mt-8">
              <RestaurantRegisterForm />
            </div>
          )}
          
          <div className="text-center mt-4 space-y-4">
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

      {/* E-Mail-Bestätigungs-Popup */}
      <EmailVerificationPopup 
        isOpen={showVerificationPopup} 
        onClose={() => setShowVerificationPopup(false)}
        email={registeredEmail}
      />
    </div>
  );
}