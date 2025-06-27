import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router'; // Hinzugefügt
import { createBrowserClient } from '@supabase/ssr'; // Hinzugefügt
import { motion } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle, FiBell, FiLock, FiGlobe, FiTrash2, FiSave } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import RestaurantSidebar from '../../../components/restaurant/RestaurantSidebar';
import { NotificationSettings, PrivacySettings } from '@/types/settings';

interface RestaurantData {
  id: string;
  name: string;
  // email: string; // Entfernt, da nicht mehr von GSSP für Restaurant-Objekt geladen
  userId: string;
  isActive: boolean;
  contractStatus: string;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
}

interface SettingsPageProps {
  restaurant: RestaurantData;
}

export default function RestaurantSettings({ restaurant }: SettingsPageProps) {
  console.log('Initial Notification Settings:', restaurant.notificationSettings);
  console.log('Initial Privacy Settings:', restaurant.privacySettings);
  const router = useRouter(); // Hinzugefügt
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    restaurant.notificationSettings
  );
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(
    restaurant.privacySettings
  );
  
  const [message, setMessage] = useState<string | null>(null);
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPrivacySettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPassword(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Nicht authentifiziert. Bitte erneut anmelden.');
      }

      const response = await fetch('/api/restaurant/update-notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          settings: notificationSettings
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Aktualisieren der Benachrichtigungseinstellungen');
      }
      
      setSuccess('Benachrichtigungseinstellungen erfolgreich aktualisiert');
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren der Benachrichtigungseinstellungen:', error);
      setError(error.message || 'Ein unerwarteter Fehler ist aufgetreten');
    }
  };
  
  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Nicht authentifiziert. Bitte erneut anmelden.');
      }

      const response = await fetch('/api/restaurant/update-privacy-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          settings: privacySettings
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Aktualisieren der Datenschutzeinstellungen');
      }
      
      setSuccess('Datenschutzeinstellungen erfolgreich aktualisiert');
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren der Datenschutzeinstellungen:', error);
      setError(error.message || 'Ein unerwarteter Fehler ist aufgetreten');
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validierung
    if (password.new !== password.confirm) {
      setError('Die neuen Passwörter stimmen nicht überein');
      return;
    }
    
    if (password.new.length < 8) {
      setError('Das neue Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newPassword: password.new
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Ändern des Passworts');
      }
      
      setSuccess('Passwort erfolgreich geändert');
      setPassword({
        current: '',
        new: '',
        confirm: ''
      });
    } catch (error: any) {
      console.error('Fehler beim Ändern des Passworts:', error);
      setError(error.message || 'Ein unerwarteter Fehler ist aufgetreten');
    }
  };
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== restaurant.name) {
      setError('Bitte geben Sie den Namen Ihres Restaurants korrekt ein, um fortzufahren');
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler bei der Anfrage zur Kontolöschung');
      }
      
      const result = await response.json();
      setSuccess(result.message || 'Anfrage zur Kontolöschung erfolgreich. Sie werden abgemeldet.');
      
      // Logout und Redirect
      await supabase.auth.signOut();
      router.push('/');
    } catch (error: any) {
      console.error('Fehler bei der Anfrage zur Kontolöschung:', error);
      setError(error.message || 'Ein unerwarteter Fehler ist aufgetreten');
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="flex flex-col md:flex-row">
        <RestaurantSidebar activeItem="settings" />
        
        <main className="flex-1 pt-20 px-4 md:px-8 pb-12">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Einstellungen</h1>
              <p className="text-gray-600 mt-2">
                Verwalten Sie Ihre Konto- und Datenschutzeinstellungen.
              </p>
            </div>


            
            {/* Erfolgs- oder Fehlermeldung */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg"
              >
                <div className="flex items-center">
                  <FiCheckCircle className="mr-2" />
                  <p>{success}</p>
                </div>
              </motion.div>
            )}
            
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
            
            {/* Benachrichtigungseinstellungen */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="flex items-center mb-4">
                <FiBell className="text-primary-500 mr-3" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">Benachrichtigungseinstellungen</h2>
              </div>
              
              <form onSubmit={handleNotificationSubmit}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-800 font-medium">Neue Reservierungen</h3>
                      <p className="text-gray-600 text-sm">Erhalten Sie Benachrichtigungen über neue Reservierungen</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        name="newReservations"
                        checked={notificationSettings.newReservations}
                        onChange={handleNotificationChange}
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors duration-300 ease-in-out after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 after:ease-in-out group-focus-within:outline-none group-focus-within:ring-4 group-focus-within:ring-primary-300 ${
                          notificationSettings.newReservations
                            ? 'bg-primary-600 after:translate-x-full after:border-white'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-800 font-medium">Contact Table Updates</h3>
                      <p className="text-gray-600 text-sm">Erhalten Sie Benachrichtigungen über Änderungen an Ihren Contact Tables</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        name="contactTableUpdates"
                        checked={notificationSettings.contactTableUpdates}
                        onChange={handleNotificationChange}
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors duration-300 ease-in-out after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 after:ease-in-out group-focus-within:outline-none group-focus-within:ring-4 group-focus-within:ring-primary-300 ${
                          notificationSettings.contactTableUpdates
                            ? 'bg-primary-600 after:translate-x-full after:border-white'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-800 font-medium">Plattform-Neuigkeiten</h3>
                      <p className="text-gray-600 text-sm">Erhalten Sie Updates über neue Funktionen und Änderungen der Plattform</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        name="platformNews"
                        checked={notificationSettings.platformNews}
                        onChange={handleNotificationChange}
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors duration-300 ease-in-out after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 after:ease-in-out group-focus-within:outline-none group-focus-within:ring-4 group-focus-within:ring-primary-300 ${
                          notificationSettings.platformNews
                            ? 'bg-primary-600 after:translate-x-full after:border-white'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-800 font-medium">Marketing-E-Mails</h3>
                      <p className="text-gray-600 text-sm">Erhalten Sie Tipps und Angebote zur Optimierung Ihrer Präsenz</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        name="marketingEmails"
                        checked={notificationSettings.marketingEmails}
                        onChange={handleNotificationChange}
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors duration-300 ease-in-out after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 after:ease-in-out group-focus-within:outline-none group-focus-within:ring-4 group-focus-within:ring-primary-300 ${
                          notificationSettings.marketingEmails
                            ? 'bg-primary-600 after:translate-x-full after:border-white'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                    </label>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                  >
                    <FiSave className="mr-2" />
                    Einstellungen speichern
                  </button>
                </div>
              </form>
            </div>
            
            {/* Datenschutzeinstellungen */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="flex items-center mb-4">
                <FiGlobe className="text-primary-500 mr-3" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">Datenschutzeinstellungen</h2>
              </div>
              
              <form onSubmit={handlePrivacySubmit}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-800 font-medium">Kontaktinformationen anzeigen</h3>
                      <p className="text-gray-600 text-sm">Zeigen Sie Ihre Kontaktinformationen öffentlich auf Ihrer Profilseite an</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        name="showContactInfo"
                        checked={privacySettings.showContactInfo}
                        onChange={handlePrivacyChange}
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors duration-300 ease-in-out after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 after:ease-in-out group-focus-within:outline-none group-focus-within:ring-4 group-focus-within:ring-primary-300 ${
                          privacySettings.showContactInfo
                            ? 'bg-primary-600 after:translate-x-full after:border-white'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-800 font-medium">Bewertungen erlauben</h3>
                      <p className="text-gray-600 text-sm">Erlauben Sie Nutzern, Bewertungen für Ihr Restaurant abzugeben</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        name="allowReviews"
                        checked={privacySettings.allowReviews}
                        onChange={handlePrivacyChange}
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors duration-300 ease-in-out after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 after:ease-in-out group-focus-within:outline-none group-focus-within:ring-4 group-focus-within:ring-primary-300 ${
                          privacySettings.allowReviews
                            ? 'bg-primary-600 after:translate-x-full after:border-white'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-800 font-medium">Daten für Analysen teilen</h3>
                      <p className="text-gray-600 text-sm">Erlauben Sie uns, anonymisierte Daten für Plattformanalysen zu verwenden</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="shareForAnalytics"
                        checked={privacySettings.shareForAnalytics}
                        onChange={handlePrivacyChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                  >
                    <FiSave className="mr-2" />
                    Einstellungen speichern
                  </button>
                </div>
              </form>
            </div>
            
            {/* Passwort ändern */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="flex items-center mb-4">
                <FiLock className="text-primary-500 mr-3" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">Passwort ändern</h2>
              </div>
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="current" className="block text-sm font-medium text-gray-700 mb-1">
                      Aktuelles Passwort
                    </label>
                    <input
                      type="password"
                      id="current"
                      name="current"
                      value={password.current}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="new" className="block text-sm font-medium text-gray-700 mb-1">
                      Neues Passwort
                    </label>
                    <input
                      type="password"
                      id="new"
                      name="new"
                      value={password.new}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      minLength={8}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Mindestens 8 Zeichen lang, mit Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                      Neues Passwort bestätigen
                    </label>
                    <input
                      type="password"
                      id="confirm"
                      name="confirm"
                      value={password.confirm}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Passwort ändern
                  </button>
                </div>
              </form>
            </div>
            
            {/* Konto löschen */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center mb-4">
                <FiTrash2 className="text-red-500 mr-3" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">Konto löschen</h2>
              </div>
              
              <p className="text-gray-700 mb-4">
                Wenn Sie Ihr Konto löschen, werden alle Ihre Daten dauerhaft entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Konto löschen
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border border-red-200 rounded-lg p-4 bg-red-50"
                >
                  <p className="text-red-800 mb-4">
                    Bitte geben Sie den Namen Ihres Restaurants ein, um die Löschung zu bestätigen:
                    <span className="font-semibold"> {restaurant.name}</span>
                  </p>
                  
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                    placeholder="Restaurant-Name eingeben"
                  />
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmation('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Abbrechen
                    </button>
                    
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      disabled={deleteConfirmation !== restaurant.name}
                    >
                      Endgültig löschen
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Behalte die Interfaces NotificationSettings, PrivacySettings, RestaurantData, SettingsPageProps bei

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return context.req.cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          context.res.setHeader('Set-Cookie', `${name}=${value}; Path=${options.path}; Max-Age=${options.maxAge}; HttpOnly=${options.httpOnly}; SameSite=${options.sameSite}; Secure=${options.secure}`);
        },
        remove(name: string, options: CookieOptions) {
          context.res.setHeader('Set-Cookie', `${name}=; Path=${options.path}; Max-Age=0; HttpOnly=${options.httpOnly}; SameSite=${options.sameSite}; Secure=${options.secure}`);
        },
      },
      cookieOptions: {
        name: process.env.NEXT_PUBLIC_SUPABASE_COOKIE_NAME || 'contact-tables-auth',
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      redirect: {
        destination: `/auth/login?message=Bitte melde dich an&callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  let userRole = 'CUSTOMER';
  if (user.user_metadata?.data?.role) {
    userRole = user.user_metadata.data.role;
  } else if (user.user_metadata?.role) {
    userRole = user.user_metadata.role;
  }

  if (userRole !== 'RESTAURANT') {
    return {
      redirect: {
        destination: '/?message=Kein Zugriff auf diesen Bereich.',
        permanent: false,
      },
    };
  }

  const { data: restaurantData, error: restaurantError } = await supabase
    .from('restaurants')
    .select('id, name, is_active, contract_status, userId, notification_settings, privacy_settings') // Annahme: email, notification_settings, privacy_settings existieren
    .eq('userId', user.id) // Verwende 'userId' gemäß vorheriger Korrektur für tables.tsx
    .single();

  if (restaurantError || !restaurantData) {
    console.error('Error fetching restaurant settings or not found:', restaurantError);
    return {
      redirect: {
        // Leite zur Registrierungsseite, falls das Restaurant-Profil für den User nicht existiert
        destination: '/restaurant/register?message=Restaurantprofil nicht gefunden oder nicht zugeordnet.',
        permanent: false,
      },
    };
  }

  const defaultNotificationSettings: NotificationSettings = {
    newReservations: true,
    contactTableUpdates: true,
    platformNews: true,
    marketingEmails: false,
  };

  const defaultPrivacySettings: PrivacySettings = {
    showContactInfo: true,
    allowReviews: true,
    shareForAnalytics: false,
  };

  return {
    props: {
      restaurant: {
        id: restaurantData.id,
        name: restaurantData.name,
        isActive: restaurantData.is_active,
        contractStatus: restaurantData.contract_status,
        userId: restaurantData.userId, // Wieder einkommentiert und auf userId angepasst
        notificationSettings: restaurantData.notification_settings || defaultNotificationSettings,
        privacySettings: restaurantData.privacy_settings || defaultPrivacySettings,
      } as RestaurantData, // Type assertion, stelle sicher, dass Interface RestaurantData übereinstimmt
    },
  };
};
