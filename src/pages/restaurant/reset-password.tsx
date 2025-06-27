import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiMail, FiCheck } from 'react-icons/fi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { auth } from '../../utils/supabase';

export default function RestaurantResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const { error } = await auth.resetPassword(email);
      
      if (error) {
        throw error;
      }

      setStatus({
        type: 'success',
        message: 'Eine E-Mail zum Zurücksetzen des Passworts wurde gesendet. Bitte überprüfen Sie Ihren Posteingang.',
      });
    } catch (error: any) {
      console.error('Fehler beim Zurücksetzen des Passworts:', error);
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
            <h1 className="text-3xl font-bold text-gray-800">Passwort zurücksetzen</h1>
            <p className="text-gray-600 mt-2">
              Geben Sie Ihre E-Mail-Adresse ein, um Ihr Passwort zurückzusetzen
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
          
          <form onSubmit={handleResetPassword} className="space-y-6">
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
                    Wird gesendet...
                  </span>
                ) : (
                  'Passwort zurücksetzen'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/restaurant/login')}
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Zurück zum Login
            </button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
