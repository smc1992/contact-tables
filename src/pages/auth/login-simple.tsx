import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { FiLogIn } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';
import PasswordInput from '../../components/PasswordInput';

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Direkte Anmeldung mit Supabase ohne Router oder Hooks
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error);
        setError('Ungültige E-Mail oder Passwort.');
        setIsSubmitting(false);
        return;
      }
      
      if (data?.user) {
        // Benutzerrolle aus den Metadaten abrufen
        const userRole = data.user.user_metadata?.data?.role || data.user.user_metadata?.role || 'CUSTOMER';
        
        // Direkte Weiterleitung ohne Router oder history.replaceState
        let targetPath = '/';
        if (userRole.toUpperCase() === 'ADMIN') {
          targetPath = '/dashboard/admin';
        } else if (userRole.toUpperCase() === 'RESTAURANT') {
          targetPath = '/restaurant/dashboard/simple';
        }
        
        // Direkte Weiterleitung ohne Router
        window.location.href = targetPath;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(`Ein Fehler ist aufgetreten: ${error.message || 'Unbekannter Fehler'}`);
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
              Vereinfachte Anmeldung
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Verwenden Sie diese vereinfachte Anmeldeseite, um Leistungsprobleme zu vermeiden.
            </p>
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
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Passwort vergessen?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <FiLogIn className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                </span>
                {isSubmitting ? 'Anmeldung...' : 'Anmelden'}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                Noch kein Konto? Registrieren
              </Link>
            </div>
            
            <div className="mt-4 text-center">
              <Link href="/auth/login" className="font-medium text-gray-600 hover:text-gray-500">
                Zurück zur normalen Anmeldeseite
              </Link>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
