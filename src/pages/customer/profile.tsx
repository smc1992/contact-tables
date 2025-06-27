import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import CustomerSidebar from '../../components/customer/CustomerSidebar';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/supabase';

export default function CustomerProfile() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  
  // Formularfelder
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
  });

  // Lade Benutzerprofil aus der Datenbank
  const loadUserProfile = async () => {
    if (!user || !user.id) return;
    
    try {
      // Zuerst versuchen wir, das Profil aus der Datenbank zu laden
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 bedeutet "Kein Datensatz gefunden"
        throw profileError;
      }
      
      // Kombiniere Daten aus Auth und Profil
      setFormData({
        name: (profileData?.first_name && profileData?.last_name) 
          ? `${profileData.first_name} ${profileData.last_name}` 
          : user.user_metadata?.name || '',
        email: user.email || '',
        phone: profileData?.phone || user.user_metadata?.phone || '',
        address: user.user_metadata?.address || '',
        city: user.user_metadata?.city || '',
        zipCode: user.user_metadata?.zipCode || '',
      });
    } catch (error) {
      console.error('Fehler beim Laden des Profils:', error);
      setError('Profildaten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    // Benutzer ist eingeloggt
    if (user) {
      try {
        const userRole = ((user.user_metadata?.role || '') + '').toUpperCase();
        
        // Akzeptiere sowohl 'CUSTOMER' als auch 'USER' als gültige Rollen
        if (userRole !== 'CUSTOMER' && userRole !== 'USER') {
          router.push('/');
          return;
        }
        
        // Lade Benutzerdaten
        loadUserProfile();
      } catch (error) {
        console.error('Fehler bei der Rollenprüfung:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [session, user, authLoading, router]);

  // Neuer useEffect, um formData.email zu aktualisieren, wenn sich user.email ändert
  useEffect(() => {
    if (user && user.email && user.email !== formData.email) {
      setFormData(prev => ({ ...prev, email: user.email! }));
    }
  }, [user?.email]); // Lausche auf Änderungen von user.email (oder user Objekt, falls user.email allein nicht triggert)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    console.log('[handleSubmit] Current session from useAuth:', JSON.stringify(session, null, 2));
    console.log('[handleSubmit] Current user from useAuth:', JSON.stringify(user, null, 2));
    
    if (!session || !user || !user.id) {
      setError('Benutzersitzung nicht gefunden oder ungültig. Bitte melden Sie sich erneut an.');
      setSaving(false);
      return;
    }
    
    try {
      // Aktualisiere das Benutzerprofil in der Datenbank
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: formData.name.split(' ')[0] || '',
          last_name: formData.name.split(' ').slice(1).join(' ') || '',
          updated_at: new Date().toISOString()
        });
      
      if (updateError) throw updateError;
      
      // Aktualisiere die E-Mail-Adresse für den Login, falls geändert
      if (formData.email && formData.email !== user.email) {
        const { error: emailUpdateError } = await supabase.auth.updateUser({ 
          email: formData.email 
        });
        if (emailUpdateError) throw emailUpdateError;
        // Wichtig: Supabase sendet eine Bestätigungsmail. Die Änderung wird erst nach Klick auf den Link wirksam.
        // Optional: Informiere den User im UI deutlicher darüber.
      }

      // Aktualisiere die Benutzer-Metadaten (inkl. E-Mail, falls sie dort auch genutzt wird)
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          email: formData.email, // E-Mail auch in Metadaten aktualisieren
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode
        }
      });
      
      if (metadataError) throw metadataError;
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Detaillierter Fehler beim Speichern des Profils:', error);
      let specificMessage = 'Das Profil konnte nicht gespeichert werden. Bitte versuchen Sie es später erneut.';
      if (error && error.message) {
        specificMessage += ` Fehlerdetails: ${error.message}`;
      }
      setError(specificMessage);
      // Log the error object itself for more details if it's a Supabase error
      if (error && (error.code || error.details || error.hint)) {
        console.error('Supabase error object:', JSON.stringify(error, null, 2));
      }

    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pt-20"> {/* Added pt-20 for fixed header */}
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
    <div className="min-h-screen flex flex-col pt-20"> {/* Added pt-20 for fixed header */}
      <Header />
      <div className="flex-grow flex">
        <CustomerSidebar activePage="profile" />
        <main className="flex-grow bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-6 md:p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Mein Profil</h1>
                    <p className="mt-1 text-sm text-gray-500">Bearbeiten Sie Ihre persönlichen Informationen</p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
                    {success && (
                      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-700">Profil erfolgreich aktualisiert!</p>
                      </div>
                    )}
                    
                    {error && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700">{error}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Vollständiger Name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="name"
                            id="name"
                            autoComplete="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          E-Mail-Adresse
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            name="email"
                            id="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Telefonnummer
                        </label>
                        <div className="mt-1">
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            autoComplete="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                          Adresse
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="address"
                            id="address"
                            autoComplete="street-address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          Stadt
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="city"
                            id="city"
                            autoComplete="address-level2"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                          Postleitzahl
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="zipCode"
                            id="zipCode"
                            autoComplete="postal-code"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 pt-5 border-t border-gray-200">
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
                            'Änderungen speichern'
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
