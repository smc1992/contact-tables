import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiAlertCircle, FiUser, FiMail } from 'react-icons/fi';
import PasswordInput from './PasswordInput';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RestaurantRegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
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

    if (formData.password.length < 8) {
      setStatus({ type: 'error', message: 'Das Passwort muss mindestens 8 Zeichen lang sein.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register-user/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        if (response.status === 409) {
          throw new Error(result.message || 'Ein Benutzer mit dieser E-Mail-Adresse ist bereits registriert.');
        }
        throw new Error(result.message || result.error || 'Ein Fehler bei der Registrierung ist aufgetreten.');
      }

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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="p-8 md:p-12">
        <h1 className="text-3xl font-bold mb-2">Restaurant registrieren</h1>
        <p className="text-gray-600 mb-8">Werden Sie Teil unserer Community und erreichen Sie neue Gäste.</p>

        {status.type && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg mb-6 ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
          >
            <div className="flex items-center">
              {status.type === 'success' ? <FiCheck className="w-5 h-5 mr-2" /> : <FiAlertCircle className="w-5 h-5 mr-2" />}
              {status.message}
            </div>
            {status.type === 'success' && (
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={MONTHLY_URL} target="_blank" rel="noopener noreferrer" className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg">
                  Monatszahlung (12 Monate)
                </a>
                <a href={YEARLY_URL} target="_blank" rel="noopener noreferrer" className="inline-block bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg">
                  Jahres-Abo abschließen
                </a>
              </div>
            )}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400" />
                </div>
                <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} className="w-full pl-10 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">E-Mail *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" />
                </div>
                <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} className="w-full pl-10 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Passwort *</label>
              <PasswordInput id="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              <p className="text-xs text-gray-500 mt-1">Mindestens 8 Zeichen</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Passwort bestätigen *</label>
              <PasswordInput id="confirmPassword" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Weitere Angaben können später im Dashboard ergänzt werden.</p>
            </div>
          </div>

          <div className="mt-6">
            <button type="submit" disabled={loading} className={`w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {loading ? 'Registriere...' : 'Registrieren'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}