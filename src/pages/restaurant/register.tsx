import { useState } from 'react';
import { useRouter } from 'next/router';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { FiCheck, FiAlertCircle, FiUser, FiMail } from 'react-icons/fi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PasswordInput from '../../components/PasswordInput';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RestaurantRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
    const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const MONTHLY_URL = process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_MONTHLY_URL || 'https://www.checkout-ds24.com/product/640542';
  const YEARLY_URL = process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_YEARLY_URL || 'https://www.checkout-ds24.com/product/640621';

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Die Passwörter stimmen nicht überein.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Minimal-Payload für Registrierung; weitere Details später im Dashboard
        body: JSON.stringify({
          firstName: 'Restaurant',
          lastName: 'Owner',
          restaurantName: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'RESTAURANT',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Spezifische Fehlermeldung für bereits existierende Benutzer
        if (response.status === 409) {
          throw new Error(result.details || 'Ein Benutzer mit dieser E-Mail-Adresse ist bereits registriert.');
        }
        
        throw new Error(result.details || result.error || 'Ein Fehler bei der Registrierung ist aufgetreten.');
      }

      // Erfolgsmeldung anzeigen (keine Auto-Anmeldung; E-Mail-Bestätigung erforderlich)
      setStatus({
        type: 'success',
        message: 'Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mail und bestätigen Sie Ihre Adresse, um fortzufahren.',
      });

    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Hinweis: Keine Auto-Weiterleitung mehr vor E-Mail-Bestätigung

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-xl overflow-hidden"
            >
              <div className="p-8 md:p-12">
                <h1 className="text-3xl font-bold mb-2">Restaurant registrieren</h1>
                <p className="text-gray-600 mb-8">
                  Werden Sie Teil unserer Community und erreichen Sie neue Gäste.
                </p>

                {status.type && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg mb-6 ${
                      status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}
                  >
                    <div className="flex items-center">
                      {status.type === 'success' ? (
                        <FiCheck className="w-5 h-5 mr-2" />
                      ) : (
                        <FiAlertCircle className="w-5 h-5 mr-2" />
                      )}
                      {status.message}
                    </div>
                    {status.type === 'success' && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <a
                          href={MONTHLY_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg"
                        >
                          Monatszahlung (12 Monate)
                        </a>
                        <a
                          href={YEARLY_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg"
                        >
                          Jahres-Abo abschließen
                        </a>
                      </div>
                    )}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Restaurant Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full pl-10 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        E-Mail *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMail className="text-gray-400" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-10 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Passwort *
                      </label>
                      <PasswordInput
                        id="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Mindestens 8 Zeichen</p>
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Passwort bestätigen *
                      </label>
                      <PasswordInput
                        id="confirmPassword"
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">
                        Weitere Angaben können später im Dashboard ergänzt werden.
                      </p>
                    </div>

                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Registrierung wird gesendet...
                        </span>
                      ) : (
                        'Registrierung absenden'
                      )}
                    </button>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Bereits registriert? <a href="/restaurant/login" className="text-primary-600 hover:text-primary-500 font-medium">Hier anmelden</a>
                    </p>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-700">
                      Mitgliedschaft wählen: 
                      <a
                        href={MONTHLY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-500 font-medium mr-2"
                      >
                        Monatszahlung
                      </a>
                      oder
                      <a
                        href={YEARLY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-500 font-medium ml-2"
                      >
                        Jahres-Abo
                      </a>
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}