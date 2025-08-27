import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiSettings, FiSave, FiRefreshCw, FiSend } from 'react-icons/fi';
import PasswordInput from '@/components/PasswordInput';

interface SystemSettings {
  id: string;
  site_name: string;
  site_description: string;
  contact_email: string;
  support_phone: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  default_subscription_days: number;
  max_featured_restaurants: number;
  google_maps_api_key?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  updated_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    id: '1',
    site_name: 'Contact Tables',
    site_description: 'Restaurant Reservierungssystem',
    contact_email: 'info@contact-tables.org',
    support_phone: '+49123456789',
    maintenance_mode: false,
    registration_enabled: true,
    default_subscription_days: 30,
    max_featured_restaurants: 6,
    updated_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const supabase = createClient();

  // Laden der Einstellungen
  const fetchSettings = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
      // Fallback zu Standardeinstellungen bei Fehler
      // (bereits in useState initialisiert)
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // SMTP-Verbindung testen
  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      const resp = await fetch('/api/admin/settings/test-smtp', { method: 'POST' });
      const result = await resp.json();
      if (!resp.ok || !result.ok) {
        alert(`SMTP-Test fehlgeschlagen: ${result?.message || 'Unbekannter Fehler'}`);
      } else {
        alert('SMTP-Verbindung erfolgreich.');
      }
    } catch (e: any) {
      console.error('SMTP-Test Fehler:', e);
      alert('SMTP-Test Fehler');
    } finally {
      setTestingSmtp(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push('/auth/login');
      } else if (session && user) {
        if (user.user_metadata.role !== 'admin' && user.user_metadata.role !== 'ADMIN') {
          router.push('/');
          return;
        }
        
        fetchSettings();
      }
    }
  }, [authLoading, session, user, router]);

  // Formatierung des Datums
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Formular-Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setSettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? parseInt(value, 10) 
          : value 
    }));
  };

  // Einstellungen speichern
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      alert('Einstellungen erfolgreich gespeichert');
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
      alert('Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="settings" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Systemeinstellungen</h1>
              <div className="flex space-x-3">
                <button
                  onClick={handleTestSmtp}
                  disabled={testingSmtp}
                  className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center ${testingSmtp ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {testingSmtp ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      SMTP wird getestet...
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-2" />
                      SMTP testen
                    </>
                  )}
                </button>
                <button
                  onClick={fetchSettings}
                  disabled={refreshing}
                  className={`px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {refreshing ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      Wird aktualisiert...
                    </>
                  ) : (
                    'Aktualisieren'
                  )}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <form onSubmit={handleSaveSettings}>
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden mb-6">
                  <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Allgemeine Einstellungen</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="site_name" className="block text-sm font-medium text-gray-700 mb-1">
                          Website-Name
                        </label>
                        <input
                          type="text"
                          id="site_name"
                          name="site_name"
                          value={settings.site_name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                          Kontakt-E-Mail
                        </label>
                        <input
                          type="email"
                          id="contact_email"
                          name="contact_email"
                          value={settings.contact_email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="site_description" className="block text-sm font-medium text-gray-700 mb-1">
                        Website-Beschreibung
                      </label>
                      <textarea
                        id="site_description"
                        name="site_description"
                        value={settings.site_description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="support_phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Support-Telefon
                        </label>
                        <input
                          type="tel"
                          id="support_phone"
                          name="support_phone"
                          value={settings.support_phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="google_maps_api_key" className="block text-sm font-medium text-gray-700 mb-1">
                          Google Maps API-Schlüssel
                        </label>
                        <input
                          type="text"
                          id="google_maps_api_key"
                          name="google_maps_api_key"
                          value={settings.google_maps_api_key || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="default_subscription_days" className="block text-sm font-medium text-gray-700 mb-1">
                          Standard-Abonnementdauer (Tage)
                        </label>
                        <input
                          type="number"
                          id="default_subscription_days"
                          name="default_subscription_days"
                          value={settings.default_subscription_days}
                          onChange={handleInputChange}
                          min={1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="max_featured_restaurants" className="block text-sm font-medium text-gray-700 mb-1">
                          Max. hervorgehobene Restaurants
                        </label>
                        <input
                          type="number"
                          id="max_featured_restaurants"
                          name="max_featured_restaurants"
                          value={settings.max_featured_restaurants}
                          onChange={handleInputChange}
                          min={1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex items-center space-x-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="maintenance_mode"
                          name="maintenance_mode"
                          checked={settings.maintenance_mode}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="maintenance_mode" className="ml-2 block text-sm text-gray-900">
                          Wartungsmodus aktivieren
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="registration_enabled"
                          name="registration_enabled"
                          checked={settings.registration_enabled}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="registration_enabled" className="ml-2 block text-sm text-gray-900">
                          Registrierung aktivieren
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden mb-6">
                  <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">E-Mail-Einstellungen</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="smtp_host" className="block text-sm font-medium text-gray-700 mb-1">
                          SMTP-Host
                        </label>
                        <input
                          type="text"
                          id="smtp_host"
                          name="smtp_host"
                          value={settings.smtp_host || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="smtp_port" className="block text-sm font-medium text-gray-700 mb-1">
                          SMTP-Port
                        </label>
                        <input
                          type="number"
                          id="smtp_port"
                          name="smtp_port"
                          value={settings.smtp_port || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="smtp_user" className="block text-sm font-medium text-gray-700 mb-1">
                          SMTP-Benutzername
                        </label>
                        <input
                          type="text"
                          id="smtp_user"
                          name="smtp_user"
                          value={settings.smtp_user || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="smtp_password" className="block text-sm font-medium text-gray-700 mb-1">
                          SMTP-Passwort
                        </label>
                        <PasswordInput
                          id="smtp_password"
                          name="smtp_password"
                          value={settings.smtp_password || ''}
                          onChange={handleInputChange as any}
                          className="w-full rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Zuletzt aktualisiert: {formatDate(settings.updated_at)}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {saving ? (
                      <>
                        <FiSave className="animate-pulse mr-2" />
                        Wird gespeichert...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" />
                        Einstellungen speichern
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
