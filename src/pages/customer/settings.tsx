import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FiSettings, FiBell, FiLock, FiSave, FiShield, FiTrash2 } from 'react-icons/fi';

import CustomerSidebar from '../../components/customer/CustomerSidebar';

export default function CustomerSettings() {
  const { user, signOut, session, loading: authLoading } = useAuth(); // session direkt aus useAuth holen
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Einstellungen
  const initialSettings = {
    notificationsEmail: true,
    notificationsPush: true,
    notificationsNewEvents: true,
    notificationsUpdates: true,
    notificationsMarketing: false,
    // Spracheinstellung hinzugefügt
    language: 'de',
    // Die folgenden Datenschutzeinstellungen werden nicht mehr verwendet, können aber im State-Objekt bleiben,
    // falls sie später wieder benötigt werden oder um Fehler bei bestehenden Daten zu vermeiden.
    // Alternativ könnten sie komplett entfernt werden, wenn keine Altdatenmigration nötig ist.
    privacyProfile: 'private',
    privacyContactInfo: 'private',
    privacyParticipation: 'private',
  };
  const [settings, setSettings] = useState(initialSettings);

  // Zustände für das Speichern
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    // Debug-Logging
    console.log('Settings - Auth-Status:', {
      authLoading,
      userIsActive: !!user, 
      userEmail: user?.email,
      userRole: user?.user_metadata?.role,
    });
    
    // Wenn die Authentifizierung noch lädt, warten wir
    if (authLoading) {
      console.log('Auth lädt noch, warte...');
      return;
    }
    
    if (!user && !authLoading) { // Prüfe auf user und dass authLoading abgeschlossen ist
      console.log('Keine Sitzung gefunden, Weiterleitung zur Login-Seite...');
      router.push('/auth/login');
      return;
    }
    
    // Benutzer ist eingeloggt
    if (user) {
      try {
        const userRole = ((user.user_metadata?.role || '') + '').toUpperCase();
        console.log('Benutzerrolle erkannt:', userRole);
        
        // Akzeptiere sowohl 'CUSTOMER' als auch 'USER' als gültige Rollen
        if (userRole !== 'CUSTOMER' && userRole !== 'USER') {
          console.log('Unzulässige Rolle für Kunden-Bereich:', userRole);
          router.push('/');
          return;
        }
        
        // Gültige Rolle, Einstellungen laden
        console.log('Gültige Kundenrolle erkannt, lade Einstellungen...');
        
        // Hier würde normalerweise ein API-Aufruf stehen
        // Beispiel: const response = await fetch('/api/customer/settings');
        
        // Simuliere das Laden der Einstellungen
        setTimeout(() => {
          // Benutze die Standardeinstellungen oder lade sie aus den Benutzermetadaten
          const userSettings = user.user_metadata?.settings || {};
          setSettings({
            ...settings,
            ...userSettings
          });
          setLoading(false);
        }, 500);
        
      } catch (error) {
        console.error('Fehler bei der Rollenprüfung:', error);
        setLoading(false);
      }
    } else {
      // Sitzung vorhanden, aber kein Benutzer (sollte nicht vorkommen)
      console.log('Benutzer nicht gefunden, aber Sitzung vorhanden.');
      setLoading(false);
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      console.log('Speichere Einstellungen:', settings);
      
      // Profil und Einstellungen aktualisieren
      const profileData = {
        name: user?.user_metadata?.name || 'Benutzer',
        languageCode: settings.language || 'DE',
      };
      
      // Profil aktualisieren
      console.log('Aktualisiere Profil mit:', profileData);
      const profileResponse = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        console.error('Fehler beim Aktualisieren des Profils:', errorData);
        throw new Error(errorData.message || 'Das Profil konnte nicht gespeichert werden.');
      }
      
      const profileResult = await profileResponse.json();
      console.log('Profil erfolgreich aktualisiert:', profileResult);
      
      // Einstellungen aktualisieren
      console.log('Aktualisiere Einstellungen mit:', settings);
      const settingsResponse = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (!settingsResponse.ok) {
        const errorData = await settingsResponse.json();
        console.error('Fehler beim Aktualisieren der Einstellungen:', errorData);
        throw new Error(errorData.message || 'Die Einstellungen konnten nicht gespeichert werden.');
      }
      
      const settingsResult = await settingsResponse.json();
      console.log('Einstellungen erfolgreich aktualisiert:', settingsResult);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Fehler beim Speichern:', error);
      setError(error.message || 'Die Daten konnten nicht gespeichert werden. Bitte versuchen Sie es später erneut.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-lg">Laden...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex">
        <CustomerSidebar activePage="settings" />
        <main className="flex-grow bg-gray-50 p-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
                  <p className="mt-1 text-sm text-gray-500">Passen Sie Ihre Benachrichtigungs- und Datenschutzeinstellungen an</p>
                </div>
                
                <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
                  {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-700">Einstellungen erfolgreich gespeichert!</p>
                    </div>
                  )}
                  
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-700">{error}</p>
                    </div>
                  )}
                  
                  {/* Spracheinstellungen */}
                  <div className="mb-8">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <FiSettings className="mr-2 h-5 w-5 text-indigo-500" />
                      Allgemeine Einstellungen
                    </h2>
                    
                    <div className="mt-4">
                      <label htmlFor="language" className="block text-sm font-medium text-gray-700">Sprache</label>
                      <select
                        id="language"
                        name="language"
                        value={settings.language}
                        onChange={handleInputChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="de">Deutsch</option>
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                      </select>
                      <p className="mt-1 text-sm text-gray-500">Wählen Sie Ihre bevorzugte Sprache für die Benutzeroberfläche</p>
                    </div>
                  </div>
                  
                  {/* Benachrichtigungseinstellungen */}
                  <div className="mb-8 pt-8 border-t border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <FiBell className="mr-2 h-5 w-5 text-indigo-500" />
                      Benachrichtigungen
                    </h2>
                    
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="notificationsEmail"
                            name="notificationsEmail"
                            type="checkbox"
                            checked={settings.notificationsEmail}
                            onChange={handleInputChange}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="notificationsEmail" className="font-medium text-gray-700">E-Mail-Benachrichtigungen</label>
                          <p className="text-gray-500">Erhalten Sie Benachrichtigungen per E-Mail</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="notificationsPush"
                            name="notificationsPush"
                            type="checkbox"
                            checked={settings.notificationsPush}
                            onChange={handleInputChange}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="notificationsPush" className="font-medium text-gray-700">Push-Benachrichtigungen</label>
                          <p className="text-gray-500">Erhalten Sie Push-Benachrichtigungen in der App</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="notificationsNewEvents"
                            name="notificationsNewEvents"
                            type="checkbox"
                            checked={settings.notificationsNewEvents}
                            onChange={handleInputChange}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="notificationsNewEvents" className="font-medium text-gray-700">Neue Events & Vorschläge</label>
                          <p className="text-gray-500">Benachrichtigungen über neue Kontakttische, die Sie interessieren könnten</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="notificationsUpdates"
                            name="notificationsUpdates"
                            type="checkbox"
                            checked={settings.notificationsUpdates}
                            onChange={handleInputChange}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="notificationsUpdates" className="font-medium text-gray-700">Updates zu Ihren Events</label>
                          <p className="text-gray-500">Benachrichtigungen über Änderungen oder Nachrichten zu Ihren gebuchten Kontakttischen</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="notificationsMarketing"
                            name="notificationsMarketing"
                            type="checkbox"
                            checked={settings.notificationsMarketing}
                            onChange={handleInputChange}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="notificationsMarketing" className="font-medium text-gray-700">Angebote & Marketing</label>
                          <p className="text-gray-500">Erhalten Sie Informationen zu Sonderangeboten und Marketingaktionen</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kontoverwaltung */}
                  <div className="mb-8 pt-8 border-t border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <FiShield className="mr-2 h-5 w-5 text-red-500" />
                      Kontosicherheit
                    </h2>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Wenn Sie Ihr Konto löschen, werden alle Ihre personenbezogenen Daten dauerhaft entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm('Möchten Sie Ihr Konto wirklich dauerhaft löschen? Alle Ihre Daten gehen dabei verloren. Diese Aktion kann nicht rückgängig gemacht werden.')) {
                            setIsDeleting(true);
                            setDeleteError(null);
                            try {
                              const accessToken = session?.access_token; // Kommt jetzt von useAuth
                              console.log('Client-side access token for delete request:', accessToken);

                              const headers: HeadersInit = {
                                'Content-Type': 'application/json',
                              };
                              if (accessToken) {
                                headers['Authorization'] = `Bearer ${accessToken}`;
                              }

                              const response = await fetch('/api/user/delete', {
                                method: 'DELETE',
                                headers: headers,
                                credentials: 'include',
                              });
                              if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.message || 'Fehler beim Löschen des Kontos.');
                              }
                              // Erfolgreich gelöscht
                              alert('Ihr Konto wurde erfolgreich gelöscht.');
                              signOut(); // Benutzer ausloggen
                              router.push('/'); // Zur Startseite weiterleiten
                            } catch (error: any) {
                              console.error('Fehler beim Löschen des Kontos:', error);
                              setDeleteError(error.message || 'Ein unbekannter Fehler ist aufgetreten.');
                            } finally {
                              setIsDeleting(false);
                            }
                          }
                        }}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        disabled={isDeleting}
                      >
                        <FiTrash2 className="mr-2 h-5 w-5" />
                        {isDeleting ? 'Wird gelöscht...' : 'Konto dauerhaft löschen'}
                      </button>
                      {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
                    </div>
                  </div>

                  <div className="pt-5 border-t border-gray-200">
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Speichern...
                          </>
                        ) : (
                          <>
                            <FiSave className="mr-2 h-5 w-5" />
                            Einstellungen speichern
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
