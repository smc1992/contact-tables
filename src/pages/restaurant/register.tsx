import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiCheck, FiAlertCircle, FiUser, FiMail, FiPhone, FiMapPin, FiFileText, FiTag, FiUsers, FiClock } from 'react-icons/fi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { supabase, auth } from '../../utils/supabase';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  description: string;
  cuisine: string;
  capacity: string;
  openingHours: string;
}

export default function RestaurantRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    description: '',
    cuisine: '',
    capacity: '',
    openingHours: '',
  });
  
  const [loading, setLoading] = useState(false);

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

    try {
      // Passwörter überprüfen
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Die Passwörter stimmen nicht überein');
      }

      if (formData.password.length < 8) {
        throw new Error('Das Passwort muss mindestens 8 Zeichen lang sein');
      }

      // 1. Benutzer mit Supabase registrieren
      const { data: authData, error: authError } = await auth.signUp(
        formData.email,
        formData.password,
        {
          // options
          data: { // Wird in raw_user_meta_data oder app_metadata gespeichert, je nach Supabase-Konfiguration
            role: 'RESTAURANT',
            name: formData.name, // Hinzugefügt, um den Namen für den Trigger bereitzustellen
          }
        }
      );

      if (authError) {
        throw new Error(authError.message || 'Fehler bei der Registrierung');
      }

      const { user: authUser, session: authSession } = authData;
      console.log('[Register Page] User after signUp:', JSON.stringify(authUser, null, 2));

      if (!authUser) {
        console.error('[Register Page] Kein Benutzerobjekt nach der Registrierung erhalten.');
        setStatus({
          type: 'error',
          message: 'Fehler bei der Registrierung: Kein Benutzerobjekt erhalten.',
        });
        setLoading(false);
        return;
      }

      // Metadaten aktualisieren (optional, aber gut für die Rolle)
      if (formData.name || authUser.role !== 'RESTAURANT') { // Überprüfen, ob Rolle bereits gesetzt ist
        const { data: updatedUser, error: updateUserError } = await supabase.auth.updateUser({
          data: { 
            full_name: formData.name, // Standard Supabase Metadatenfeld für den Namen
            role: 'RESTAURANT' 
          }
        });
        if (updateUserError) {
          console.error('[Register Page] Fehler beim Aktualisieren der Benutzermetadaten:', updateUserError);
          // Nicht unbedingt ein Showstopper, aber loggen
        } else {
          console.log('[Register Page] Benutzermetadaten aktualisiert:', updatedUser);
        }
      }

      // WICHTIG: Restaurant-Profil NICHT sofort erstellen, da E-Mail-Bestätigung erforderlich ist.
      // Informieren Sie den Benutzer stattdessen.
      
      setStatus({
        type: 'success',
        message: 'Registrierung erfolgreich! Bitte überprüfen Sie Ihr E-Mail-Postfach, um Ihre E-Mail-Adresse zu bestätigen. Danach können Sie sich anmelden und Ihr Restaurantprofil vervollständigen.',
      });

      // Formular leeren
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: '',
        description: '',
        cuisine: '',
        capacity: '',
        openingHours: '',
      });

      // Optional: Benutzer auf eine Informationsseite weiterleiten oder einfach die Nachricht anzeigen lassen.
      // router.push('/auth/check-email'); 

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
                      <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        minLength={8}
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
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Telefon *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiPhone className="text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-10 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMapPin className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          required
                          value={formData.address}
                          onChange={handleChange}
                          className="w-full pl-10 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-2">
                        Küche / Kategorie *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiTag className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="cuisine"
                          name="cuisine"
                          required
                          value={formData.cuisine}
                          onChange={handleChange}
                          className="w-full pl-10 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="z.B. Italienisch, Mediterran"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
                        Kapazität (Sitzplätze) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUsers className="text-gray-400" />
                        </div>
                        <input
                          type="number"
                          id="capacity"
                          name="capacity"
                          required
                          value={formData.capacity}
                          onChange={handleChange}
                          className="w-full pl-10 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="openingHours" className="block text-sm font-medium text-gray-700 mb-2">
                        Öffnungszeiten *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiClock className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="openingHours"
                          name="openingHours"
                          required
                          value={formData.openingHours}
                          onChange={handleChange}
                          className="w-full pl-10 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="z.B. Mo-Fr 10-22 Uhr, Sa-So 12-22 Uhr"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Beschreibung *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        required
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Beschreiben Sie Ihr Restaurant, die Atmosphäre und was Ihre Gäste erwartet..."
                      />
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