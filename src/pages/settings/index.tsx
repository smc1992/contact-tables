import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../../components/PageLayout';
import { userApi } from '../../utils/api';
import { FiSettings, FiBell, FiLock, FiGlobe, FiSave, FiAlertCircle } from 'react-icons/fi';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      eventReminders: true,
      messages: true,
      marketing: false
    },
    privacy: {
      profileVisibility: 'public',
      showContactInfo: false,
      allowLocationAccess: true
    },
    language: 'de',
    theme: 'light'
  });
  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        setLoading(true);
        
        // Echten API-Aufruf verwenden
        const { data, error } = await userApi.getSettings();
        
        if (error) {
          console.error('Fehler beim Laden der Einstellungen:', error);
          setError('Einstellungen konnten nicht geladen werden.');
        } else if (data && data.settings) {
          setSettings(data.settings);
        } else {
          // Fallback zu Standard-Einstellungen, wenn keine Einstellungen vorhanden sind oder das Format nicht stimmt
          console.log('Keine Einstellungen gefunden oder falsches Datenformat, verwende Standard-Einstellungen');
          // Die Standard-Einstellungen sind bereits im State definiert
        }
      } catch (err) {
        console.error('Unerwarteter Fehler beim Laden der Einstellungen:', err);
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, router]);

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    });
  };

  const handlePrivacyChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: value
      }
    });
  };

  const handleLanguageChange = (value: string) => {
    setSettings({
      ...settings,
      language: value
    });
  };

  const handleThemeChange = (value: string) => {
    setSettings({
      ...settings,
      theme: value
    });
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setSuccessMessage(null);
      setError(null);
      
      // Echten API-Aufruf verwenden
      const { error } = await userApi.updateSettings(settings);
      
      if (error) {
        console.error('Fehler beim Speichern der Einstellungen:', error);
        setError('Einstellungen konnten nicht gespeichert werden.');
      } else {
        setSuccessMessage('Einstellungen wurden erfolgreich gespeichert!');
        
        // Erfolgsbenachrichtigung nach 3 Sekunden ausblenden
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Unerwarteter Fehler beim Speichern der Einstellungen:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Einstellungen">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <FiSettings className="text-2xl text-primary mr-3" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <FiAlertCircle className="mr-2" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
            <FiSave className="mr-2" />
            {successMessage}
          </div>
        )}

        <div className="space-y-8">
          {/* Benachrichtigungseinstellungen */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FiBell className="mr-2 text-primary" />
              Benachrichtigungen
            </h2>
            <div className="space-y-3 pl-2">
              <div className="flex items-center justify-between">
                <label htmlFor="email-notif" className="text-gray-700">E-Mail-Benachrichtigungen</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    id="email-notif"
                    checked={settings.notifications.email}
                    onChange={(e) => handleNotificationChange('email', e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="push-notif" className="text-gray-700">Push-Benachrichtigungen</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    id="push-notif"
                    checked={settings.notifications.push}
                    onChange={(e) => handleNotificationChange('push', e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="event-notif" className="text-gray-700">Event-Erinnerungen</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    id="event-notif"
                    checked={settings.notifications.eventReminders}
                    onChange={(e) => handleNotificationChange('eventReminders', e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="message-notif" className="text-gray-700">Nachrichtenbenachrichtigungen</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    id="message-notif"
                    checked={settings.notifications.messages}
                    onChange={(e) => handleNotificationChange('messages', e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="marketing-notif" className="text-gray-700">Marketing-E-Mails</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    id="marketing-notif"
                    checked={settings.notifications.marketing}
                    onChange={(e) => handleNotificationChange('marketing', e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Datenschutzeinstellungen */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FiLock className="mr-2 text-primary" />
              Datenschutz
            </h2>
            <div className="space-y-4 pl-2">
              <div>
                <label className="block text-gray-700 mb-2">Profilsichtbarkeit</label>
                <select
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="public">Öffentlich</option>
                  <option value="contacts">Nur für Kontakte</option>
                  <option value="private">Privat</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="contact-info" className="text-gray-700">Kontaktinformationen anzeigen</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    id="contact-info"
                    checked={settings.privacy.showContactInfo}
                    onChange={(e) => handlePrivacyChange('showContactInfo', e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="location-access" className="text-gray-700">Standortzugriff erlauben</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    id="location-access"
                    checked={settings.privacy.allowLocationAccess}
                    onChange={(e) => handlePrivacyChange('allowLocationAccess', e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Spracheinstellungen */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FiGlobe className="mr-2 text-primary" />
              Sprache und Darstellung
            </h2>
            <div className="space-y-4 pl-2">
              <div>
                <label className="block text-gray-700 mb-2">Sprache</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="de">Deutsch</option>
                  <option value="en">Englisch</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Design</label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="light">Hell</option>
                  <option value="dark">Dunkel</option>
                  <option value="system">Systemeinstellung</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition flex items-center justify-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Speichern...
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
      </div>

      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }
        
        input:checked + .slider {
          background-color: var(--color-primary);
        }
        
        input:focus + .slider {
          box-shadow: 0 0 1px var(--color-primary);
        }
        
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        
        .slider.round {
          border-radius: 24px;
        }
        
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
    </PageLayout>
  );
}
