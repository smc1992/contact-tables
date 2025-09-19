import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { FiMail, FiSend } from 'react-icons/fi';
import { createBrowserClient } from '@supabase/ssr';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

    if (!email) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        throw error;
      }

      setSuccess('Eine neue Bestätigungs-E-Mail wurde an Ihre E-Mail-Adresse gesendet. Bitte überprüfen Sie Ihren Posteingang und beachten Sie, dass der Link nur 1 Stunde gültig ist.');
    } catch (err: any) {
      setError(err.message || 'Fehler beim Senden der Bestätigungs-E-Mail.');
    } finally {
      setLoading(false);
    }
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
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <FiMail className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Bestätigungs-E-Mail erneut senden</h2>
            <p className="mt-2 text-sm text-gray-600">
              Geben Sie Ihre E-Mail-Adresse ein, um eine neue Bestätigungs-E-Mail zu erhalten.
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
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
                  <FiSend className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
                </span>
                {loading ? 'Wird gesendet...' : 'Bestätigungs-E-Mail senden'}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Zurück zum{' '}
              <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                Login
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
