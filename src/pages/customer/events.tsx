import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import CustomerSidebar from '../../components/customer/CustomerSidebar';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FiCalendar, FiMapPin, FiUsers, FiClock, FiEdit2, FiTrash2, FiPlus, FiInfo } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/supabase';

type ContactTable = Database['public']['Tables']['contact_tables']['Row'];

interface ContactTableWithDetails extends ContactTable {
  restaurant?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    postal_code?: string;
  } | null;
  current_participants?: number;
  participants_count?: number;
}

export default function CustomerEvents() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contactTables, setContactTables] = useState<ContactTableWithDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  

  // Lade Kontakttische
  const loadContactTables = async () => {
    if (!session || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Lade Kontakttische, an denen der Benutzer teilnimmt
      const { data: participations, error: participationsError } = await supabase
        .from('participations')
        .select('event_id')
        .eq('user_id', user.id);
        
      if (participationsError) {
        console.error('Fehler beim Laden der Teilnahmen:', participationsError);
        setError('Fehler beim Laden deiner Events. Bitte versuche es später erneut.');
        setLoading(false);
        return;
      }
      
      if (!participations || participations.length === 0) {
        // Keine Teilnahmen gefunden
        setContactTables([]);
        setLoading(false);
        return;
      }
      
      // IDs der Kontakttische extrahieren
      const contactTableIds = participations.map(p => p.event_id);
      
      // Kontakttische mit Restaurant-Details abrufen
      const { data: tables, error: tablesError } = await supabase
        .from('contact_tables')
        .select(`
          *,
          restaurant:restaurant_id(*)
        `)
        .in('id', contactTableIds)
        .order('datetime', { ascending: true });
        
      if (tablesError) {
        console.error('Fehler beim Laden der Kontakttische:', tablesError);
        setError('Fehler beim Laden deiner Events. Bitte versuche es später erneut.');
        setLoading(false);
        return;
      }
      
      if (!tables || tables.length === 0) {
        setContactTables([]);
        setLoading(false);
        return;
      }
      
      // Setze die Kontakttische ohne auf Teilnehmerzahlen zu warten
      setContactTables(tables);
      setLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Kontakttische:', error);
      setError('Die Kontakttische konnten nicht geladen werden. Bitte versuche es später erneut.');
      setLoading(false);
    }
  };

  // Kontakttisch aus Teilnahmen entfernen
  const leaveContactTable = async (id: string) => {
    if (confirm('Möchten Sie wirklich nicht mehr an diesem Kontakttisch teilnehmen?')) {
      try {
        if (!user || !user.id) {
          throw new Error('Benutzer nicht gefunden');
        }
        
        const { error } = await supabase
          .from('participations')
          .delete()
          .eq('event_id', id)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        // Aktualisiere die Liste
        setContactTables(contactTables.filter(table => table.id !== id));
      } catch (error) {
        console.error('Fehler beim Verlassen des Kontakttisches:', error);
        alert('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
      }
    }
  };

  useEffect(() => {
    // Wenn die Authentifizierung noch lädt, warten wir
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
        
        // Gültige Rolle, Kontakttische laden
        loadContactTables();
      } catch (error) {
        console.error('Fehler bei der Rollenprüfung:', error);
        setLoading(false);
      }
    } else {
      // Sitzung vorhanden, aber kein Benutzer (sollte nicht vorkommen)
      setLoading(false);
    }
  }, [session, user, authLoading, router]);

  // Status-Badge-Farbe basierend auf dem Status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Status-Text basierend auf dem Status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Aktiv';
      case 'PENDING':
        return 'Ausstehend';
      case 'CANCELLED':
        return 'Storniert';
      case 'COMPLETED':
        return 'Abgeschlossen';
      default:
        return status;
    }
  };
  
  // Formatiere Datum und Zeit
  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return {
        date: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      };
    } catch (e) {
      return { date: dateTimeStr, time: '' };
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
      <div className="flex-grow flex flex-col md:flex-row">
        <CustomerSidebar activePage="events" />
        <main className="flex-grow bg-gray-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">Meine Events</h1>
                <Link href="/customer/create-event" legacyBehavior>
                  <a className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition duration-150">
                    <FiPlus className="mr-2" /> Event erstellen
                  </a>
                </Link>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Fehler: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
              )}

              {contactTables.length === 0 && !loading && (
                <div className="text-center py-12">
                  <FiCalendar className="mx-auto text-6xl text-gray-400 mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-700 mb-2">Keine Events gefunden</h2>
                  <p className="text-gray-500 mb-6">
                    Sie nehmen derzeit an keinen Events teil oder haben noch keine erstellt.
                  </p>
                  <Link href="/restaurants" legacyBehavior>
                    <a className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg inline-flex items-center transition duration-150">
                      <FiPlus className="mr-2" /> Neue Kontakttische entdecken
                    </a>
                  </Link>
                </div>
              )}

              {contactTables.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contactTables.map((table) => {
                    const { date, time } = formatDateTime(table.datetime || '');
                    return (
                      <motion.div
                        key={table.id}
                        className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-xl font-semibold text-primary-700 truncate" title={table.title || 'Unbenannter Tisch'}>
                              {table.title || 'Unbenannter Tisch'}
                            </h3>
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(table.status || 'UNKNOWN')}`}
                            >
                              {getStatusText(table.status || 'UNKNOWN')}
                            </span>
                          </div>

                          {table.restaurant && (
                            <div className="flex items-center text-sm text-gray-600 mb-1">
                              <FiMapPin className="mr-2 text-secondary-500 flex-shrink-0" />
                              <span className="truncate" title={`${table.restaurant.name}, ${table.restaurant.address}`}>
                                {table.restaurant.name}, {table.restaurant.address}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <FiCalendar className="mr-2 text-secondary-500 flex-shrink-0" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mb-3">
                            <FiClock className="mr-2 text-secondary-500 flex-shrink-0" />
                            <span>{time} Uhr</span>
                          </div>

                          <div className="flex items-center text-sm text-gray-600 mb-4">
                            <FiUsers className="mr-2 text-secondary-500 flex-shrink-0" />
                            <span>
                              {table.participants_count !== undefined
                                ? `${table.participants_count} / ${table.max_participants} Teilnehmer`
                                : `? / ${table.max_participants} Teilnehmer`}
                            </span>
                          </div>

                          {table.description && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-md">
                              <div className="flex items-start text-sm text-gray-700">
                                <FiInfo className="mr-2 mt-1 text-secondary-500 flex-shrink-0" />
                                <p className="break-words clamp-3 leading-relaxed" title={table.description}>
                                  {table.description}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="mt-auto border-t pt-4 flex justify-end space-x-3">
                            <button
                              onClick={() => router.push(`/customer/edit-event/${table.id}`)}
                              className="text-primary-600 hover:text-primary-800 transition-colors duration-150 text-sm font-medium flex items-center"
                              title="Event bearbeiten"
                            >
                              <FiEdit2 className="mr-1.5 h-4 w-4" /> Bearbeiten
                            </button>
                            <button
                              onClick={() => leaveContactTable(table.id)}
                              className="text-red-500 hover:text-red-700 transition-colors duration-150 text-sm font-medium flex items-center"
                              title="Event verlassen"
                            >
                              <FiTrash2 className="mr-1.5 h-4 w-4" /> Verlassen
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
