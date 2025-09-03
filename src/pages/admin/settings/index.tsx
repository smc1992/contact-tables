import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiSettings, FiSave, FiRefreshCw, FiSend, FiDatabase, FiMail, FiX, FiKey } from 'react-icons/fi';
import PasswordInput from '@/components/PasswordInput';
import { withAuth } from '@/utils/withAuth';
import dynamic from 'next/dynamic';
import DkimKeyGenerator from '@/components/admin/DkimKeyGenerator';
import DnsSetupGuide from '@/components/admin/DnsSetupGuide';

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
  email_signature?: string;
  spf_record?: string;
  dkim_selector?: string;
  dkim_private_key?: string;
  dkim_public_key?: string;
  dmarc_policy?: string;
  email_tracking_enabled?: boolean;
  bounce_handling_email?: string;
  updated_at: string;
}

interface SettingsPageProps {
  user: User;
}

function SettingsPage({ user }: SettingsPageProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings>({
    id: '00000000-0000-0000-0000-000000000001',
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
  const [testingEmail, setTestingEmail] = useState(false);
  const [creatingTable, setCreatingTable] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDnsGuide, setShowDnsGuide] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);
  // Einstellungen aus der Datenbank laden über API-Route
  const fetchSettings = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/settings/get');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Fehler beim Laden der Einstellungen:', errorData);
        return;
      }

      const data = await response.json();
      
      if (data) {
        console.log('Geladene Einstellungen:', data);
        setSettings(data);
      } else {
        console.log('Keine Einstellungen gefunden, verwende Standardwerte');
      }
    } catch (err) {
      console.error('Unerwarteter Fehler beim Laden der Einstellungen:', err);
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

  // Modal für E-Mail-Test öffnen
  const openEmailTestModal = () => {
    setTestEmailAddress(user.email || settings.contact_email || '');
    setShowEmailModal(true);
    // Fokus auf das Input-Feld setzen, wenn das Modal geöffnet wird
    setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    }, 100);
  };

  // E-Mail mit Signatur testen
  const handleTestEmail = async () => {
    if (!testEmailAddress) {
      alert('Bitte geben Sie eine E-Mail-Adresse ein.');
      return;
    }
    
    setTestingEmail(true);
    setShowEmailModal(false);
    
    try {
      const resp = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: testEmailAddress })
      });
      
      const result = await resp.json();
      
      if (!resp.ok || !result.success) {
        alert(`E-Mail-Test fehlgeschlagen: ${result?.error || result?.message || 'Unbekannter Fehler'}`);
      } else {
        alert(`Test-E-Mail wurde an ${testEmailAddress} gesendet. Bitte prüfen Sie den Posteingang.`);
      }
    } catch (e: any) {
      console.error('E-Mail-Test Fehler:', e);
      alert(`E-Mail-Test Fehler: ${e.message || 'Unbekannter Fehler'}`);
    } finally {
      setTestingEmail(false);
    }
  };
  
  // DKIM-Schlüssel vom Generator übernehmen
  const handleKeysGenerated = (privateKey: string, publicKey: string, dnsRecord: string) => {
    setSettings(prev => ({
      ...prev,
      dkim_private_key: privateKey,
      dkim_public_key: dnsRecord
    }));
    
    // Scrolle zu den Eingabefeldern
    setTimeout(() => {
      document.getElementById('dkim_private_key')?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  };

  // System-Settings-Tabelle erstellen oder aktualisieren
  const handleCreateTable = async () => {
    setCreatingTable(true);
    try {
      const resp = await fetch('/api/admin/settings/create-table', { method: 'POST' });
      const result = await resp.json();
      if (!resp.ok) {
        alert(`Tabellenerstellung fehlgeschlagen: ${result?.error || 'Unbekannter Fehler'}`);
      } else {
        alert('System-Settings-Tabelle wurde erfolgreich erstellt oder aktualisiert.');
        // Einstellungen neu laden
        await fetchSettings();
      }
    } catch (e: any) {
      console.error('Tabellenerstellung Fehler:', e);
      alert('Fehler bei der Tabellenerstellung');
    } finally {
      setCreatingTable(false);
    }
  };

  // Daten laden, wenn die Komponente gemountet wird
  useEffect(() => {
    fetchSettings();
  }, []);

  // Formatierung des Datums
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Formular-Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement | HTMLSelectElement;
    
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
      // API-Route zum Speichern der Einstellungen verwenden
      const response = await fetch('/api/admin/settings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          updated_at: new Date().toISOString()
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Unbekannter Fehler');
      }
      
      alert('Einstellungen erfolgreich gespeichert');
      
      // Wenn DKIM-Schlüssel vorhanden sind, zeige die DNS-Einrichtungsanleitung an
      if (settings.dkim_private_key && settings.dkim_public_key) {
        setShowDnsGuide(true);
        // Scrolle zur DNS-Anleitung
        setTimeout(() => {
          document.getElementById('dns-setup-guide')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
      alert(`Fehler beim Speichern der Einstellungen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
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
                  onClick={handleCreateTable}
                  disabled={creatingTable}
                  className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center ${creatingTable ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {creatingTable ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      Tabelle wird erstellt...
                    </>
                  ) : (
                    <>
                      <FiDatabase className="mr-2" />
                      Tabelle erstellen/aktualisieren
                    </>
                  )}
                </button>
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
                  onClick={openEmailTestModal}
                  disabled={testingEmail}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center ${testingEmail ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {testingEmail ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      E-Mail wird gesendet...
                    </>
                  ) : (
                    <>
                      <FiMail className="mr-2" />
                      E-Mail-Test senden
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="bounce_handling_email" className="block text-sm font-medium text-gray-700 mb-1">
                          Bounce-Handling E-Mail
                        </label>
                        <input
                          type="email"
                          id="bounce_handling_email"
                          name="bounce_handling_email"
                          value={settings.bounce_handling_email || ''}
                          onChange={handleInputChange}
                          placeholder="bounces@ihredomain.de"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">E-Mail-Adresse für Bounce-Benachrichtigungen (z.B. für Return-Path Header)</p>
                      </div>
                      
                      <div className="flex items-center h-full pt-6">
                        <input
                          type="checkbox"
                          id="email_tracking_enabled"
                          name="email_tracking_enabled"
                          checked={settings.email_tracking_enabled || false}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="email_tracking_enabled" className="ml-2 block text-sm text-gray-900">
                          E-Mail-Tracking aktivieren
                        </label>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              Die E-Mail-Signatur wird automatisch am Ende jeder ausgehenden E-Mail eingefügt.
                            </p>
                          </div>
                        </div>
                      </div>
                      <label htmlFor="email_signature" className="block text-lg font-medium text-gray-800 mb-2">
                        E-Mail-Signatur
                      </label>
                      <textarea
                        id="email_signature"
                        name="email_signature"
                        value={settings.email_signature || `<table style="font-family: Arial, sans-serif; color: #333333; padding-top: 15px; width: 100%; max-width: 600px;">
  <tr>
    <td style="vertical-align: top; padding-right: 15px; width: 100px;">
      <img src="https://contact-tables.de/images/logo-footer.webp" alt="Contact Tables Logo" style="width: 80px; height: auto; display: block;">
    </td>
    <td style="vertical-align: top;">
      <p style="margin: 0; font-weight: bold; font-size: 16px; color: #333333;">Anette Rapp Contact-Tables</p>
      <p style="margin: 5px 0; font-size: 13px;">
        <a href="https://contact-tables.de" style="color: #333333; text-decoration: none;">contact-tables.de</a> | 
        <a href="mailto:info@contact-tables.org" style="color: #333333; text-decoration: none;">info@contact-tables.org</a>
      </p>
      <p style="margin: 5px 0; font-size: 12px; color: #666666;">
        Am Wiesenhang 12 | 65207 Wiesbaden | Tel: <a href="tel:+4915679640069" style="color: #666666; text-decoration: none;">+49 156 79640069</a>
      </p>
    </td>
  </tr>
</table>`}
                        onChange={handleInputChange}
                        rows={12}
                        placeholder="Ihre E-Mail-Signatur (wird am Ende jeder E-Mail eingefügt)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                      />
                      <p className="mt-2 text-sm text-gray-500">HTML-Formatierung wird unterstützt. Beispiel: &lt;p&gt;Mit freundlichen Grüßen,&lt;br&gt;Ihr Contact Tables Team&lt;/p&gt;</p>
                    </div>
                    
                    <h3 className="text-md font-medium text-gray-900 mb-3 mt-8">E-Mail-Authentifizierung (DNS-Einträge)</h3>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            Diese Einstellungen erfordern DNS-Einträge bei Ihrem Domain-Anbieter. Nach dem Speichern erhalten Sie Anweisungen zur Einrichtung.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 mb-6">
                      <div>
                        <label htmlFor="spf_record" className="block text-sm font-medium text-gray-700 mb-1">
                          SPF-Eintrag (Sender Policy Framework)
                        </label>
                        <input
                          type="text"
                          id="spf_record"
                          name="spf_record"
                          value={settings.spf_record || 'v=spf1 mx a include:_spf.google.com ~all'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Definiert, welche Server E-Mails für Ihre Domain versenden dürfen</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="dkim_selector" className="block text-sm font-medium text-gray-700 mb-1">
                          DKIM-Selector
                        </label>
                        <input
                          type="text"
                          id="dkim_selector"
                          name="dkim_selector"
                          value={settings.dkim_selector || 'default'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Name des DKIM-Selectors (z.B. 'default', 'mail', etc.)</p>
                      </div>
                      
                      <div>
                        <label htmlFor="dmarc_policy" className="block text-sm font-medium text-gray-700 mb-1">
                          DMARC-Richtlinie
                        </label>
                        <select
                          id="dmarc_policy"
                          name="dmarc_policy"
                          value={settings.dmarc_policy || 'none'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="none">None - Nur überwachen</option>
                          <option value="quarantine">Quarantine - In Spam-Ordner verschieben</option>
                          <option value="reject">Reject - E-Mails ablehnen</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Legt fest, wie mit nicht authentifizierten E-Mails umgegangen wird</p>
                      </div>
                    </div>
                    
                    <div id="dkim-generator" className="mb-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">DKIM-Schlüsselgenerator</h3>
                      <DkimKeyGenerator 
                        domain={settings.contact_email?.split('@')[1] || ''}
                        selector={settings.dkim_selector || 'default'}
                        onKeysGenerated={handleKeysGenerated}
                      />
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-center">
                        <h3 className="text-md font-medium text-gray-900 mb-3">DKIM-Schlüssel</h3>
                        <button
                          type="button"
                          onClick={() => document.getElementById('dkim-generator')?.scrollIntoView({ behavior: 'smooth' })}
                          className="ml-3 px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors flex items-center"
                        >
                          <FiKey className="mr-1" />
                          Schlüssel generieren
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6 mb-6">
                        <div>
                          <label htmlFor="dkim_private_key" className="block text-sm font-medium text-gray-700 mb-1">
                            DKIM-Privater Schlüssel
                          </label>
                          <textarea
                            id="dkim_private_key"
                            name="dkim_private_key"
                            value={settings.dkim_private_key || ''}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6 mb-6">
                        <div>
                          <label htmlFor="dkim_public_key" className="block text-sm font-medium text-gray-700 mb-1">
                            DKIM-Öffentlicher Schlüssel (für DNS-Eintrag)
                          </label>
                          <textarea
                            id="dkim_public_key"
                            name="dkim_public_key"
                            value={settings.dkim_public_key || ''}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Zuletzt aktualisiert: {formatDate(settings.updated_at)}
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {saving ? (
                        <>
                          <FiRefreshCw className="animate-spin mr-2" />
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
                </div>
                
                {/* DNS-Einrichtungsanleitung */}
                {showDnsGuide && settings.dkim_public_key && (
                  <div id="dns-setup-guide" className="mt-8">
                    <DnsSetupGuide
                      domain={settings.contact_email?.split('@')[1] || ''}
                      selector={settings.dkim_selector || 'default'}
                      spfRecord={settings.spf_record || 'v=spf1 mx a include:_spf.google.com ~all'}
                      dkimRecord={settings.dkim_public_key}
                      dmarcPolicy={settings.dmarc_policy || 'none'}
                    />
                  </div>
                )}
              </form>
            )}
            
            {/* E-Mail-Test Modal */}
            {showEmailModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">E-Mail-Test senden</h3>
                    <button 
                      onClick={() => setShowEmailModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiX size={24} />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="test-email" className="block text-sm font-medium text-gray-700 mb-1">
                      E-Mail-Adresse für den Test
                    </label>
                    <input
                      ref={emailInputRef}
                      type="email"
                      id="test-email"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="beispiel@domain.de"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleTestEmail();
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowEmailModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleTestEmail}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Test-E-Mail senden
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

// Export der Komponente
export default SettingsPage;

// Standardisiertes withAuth HOC Muster für getServerSideProps
export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'],
  async (context, user) => {
    // Hier könnten zusätzliche Daten für die Admin-Settings-Seite geladen werden
    return {
      props: { user }
    };
  }
);

// Diese Seite erfordert JavaScript zur Laufzeit und kann nicht statisch exportiert werden
export const config = {
  unstable_runtimeJS: true,
  runtime: 'nodejs'
};
