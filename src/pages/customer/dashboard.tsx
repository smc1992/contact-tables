import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import CustomerSidebar from '../../components/customer/CustomerSidebar';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiStar, FiInfo } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { Database, ContactTable } from '../../types/supabase';

interface ContactTableWithDetails extends ContactTable {
  restaurant?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    postal_code?: string;
  } | null;
  participants?: any[] | null;
}

export default function CustomerDashboard() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contactTablesLoading, setContactTablesLoading] = useState(true);
  const [contactTablesError, setContactTablesError] = useState<string | null>(null);
  const [upcomingTables, setUpcomingTables] = useState<ContactTableWithDetails[]>([]);
  const [favoriteTables, setFavoriteTables] = useState<ContactTableWithDetails[]>([]);
  
  // Funktion zum Laden der Kontakttische, an denen der Benutzer teilnimmt
  const loadParticipatingTables = async () => {
    if (!session || !user) return;
    
    try {
      setContactTablesLoading(true);
      setContactTablesError(null);
      
      
      
      // 1. Zuerst die anstehenden Kontakttische laden
      try {
        // Kontakttische abrufen, an denen der Benutzer teilnimmt
        const { data: participations, error: participationsError } = await supabase
          .from('participations')
          .select('contact_table_id')
          .eq('user_id', user.id);
        
        if (participationsError) {
          console.error('Fehler beim Laden der Teilnahmen:', participationsError);
        } else if (participations && participations.length > 0) {
          // IDs der Kontakttische extrahieren
          const tableIds = participations.map(p => p.contact_table_id);
          
          // Kontakttische mit Details abrufen
          const { data: tables, error: tablesError } = await supabase
            .from('contact_tables')
            .select(`
              *,
              restaurant:restaurant_id(*)
            `)
            .in('id', tableIds)
            .order('start_time', { ascending: true });
          
          if (tablesError) {
            console.error('Fehler beim Laden der Kontakttische:', tablesError);
          } else {
            setUpcomingTables(tables || []);
          }
        } else {
          setUpcomingTables([]);
        }
      } catch (err) {
        console.error('Fehler beim Laden der anstehenden Tische:', err);
        setUpcomingTables([]);
      }
      
      // 2. Dann die favorisierten Kontakttische laden
      try {
        // Favorisierte Kontakttische abrufen
        const { data: favorites, error: favoritesError } = await supabase
          .from('favorites')
          .select('contact_table_id')
          .eq('user_id', user.id);
        
        if (favoritesError) {
          console.error('Fehler beim Laden der Favoriten:', favoritesError);
        } else if (favorites && favorites.length > 0) {
          // IDs der favorisierten Kontakttische extrahieren
          const favoriteIds = favorites.map(f => f.contact_table_id);
          
          // Favorisierte Kontakttische mit Details abrufen
          const { data: favoriteTables, error: favoriteTablesError } = await supabase
            .from('contact_tables')
            .select(`
              *,
              restaurant:restaurant_id(*)
            `)
            .in('id', favoriteIds)
            .order('start_time', { ascending: true });
          
          if (favoriteTablesError) {
            console.error('Fehler beim Laden der favorisierten Kontakttische:', favoriteTablesError);
          } else {
            setFavoriteTables(favoriteTables || []);
          }
        } else {
          setFavoriteTables([]);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Favoriten:', err);
        setFavoriteTables([]);
      }
      
      // Lade-Status beenden, unabhängig vom Ergebnis
      setContactTablesLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      setContactTablesError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.');
      setContactTablesLoading(false);
    }
  };

  useEffect(() => {
    // Wenn die Authentifizierung noch lädt, warten wir
    if (authLoading) {
      return;
    }
    
    // Wenn keine Sitzung vorhanden ist, zur Login-Seite weiterleiten
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
        
        // Gültige Rolle, Dashboard sofort anzeigen
        setLoading(false);
        
        // Lade Kontakttische im Hintergrund
        loadParticipatingTables();
      } catch (error) {
        console.error('Fehler bei der Rollenprüfung:', error);
        // Bei einem Fehler trotzdem das Dashboard anzeigen
        setLoading(false);
      }
    } else {
      // Sitzung vorhanden, aber kein Benutzer (sollte nicht vorkommen)
      setLoading(false);
    }
  }, [session, user, authLoading, router]);

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

  // Formatierungsfunktion für Datum und Uhrzeit
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      start_time: date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <Header />
      <div className="flex-grow flex">
        <CustomerSidebar activePage="dashboard" />
        <main className="flex-grow bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Mein Dashboard</h1>
                    <Link href="/contact-tables">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FiStar className="mr-2" />
                        Neue Kontakttische entdecken
                      </button>
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Statistik-Karten */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                            <FiCalendar className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Anstehende Kontakttische
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  {contactTablesLoading ? '...' : upcomingTables.length}
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-4 py-4 sm:px-6">
                        <div className="text-sm">
                          <Link href="/customer/events" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Alle anzeigen
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-pink-500 rounded-md p-3">
                            <FiStar className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Favorisierte Kontakttische
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  {contactTablesLoading ? '...' : favoriteTables.length}
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-4 py-4 sm:px-6">
                        <div className="text-sm">
                          <Link href="/customer/favorites" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Alle anzeigen
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                            <FiUsers className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Neue Kontakte
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  {contactTablesLoading ? '...' : upcomingTables.reduce((count, table) => 
                                    count + (table.participants?.length || 0), 0)}
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-4 py-4 sm:px-6">
                        <div className="text-sm">
                          <Link href="/customer/profile" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Profil anzeigen
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Anstehende Kontakttische */}
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Anstehende Kontakttische</h2>
                    
                    {contactTablesLoading ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        </div>
                      </div>
                    ) : contactTablesError ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                        <div className="text-center text-red-500">
                          <FiInfo className="h-8 w-8 mx-auto mb-2" />
                          <p>{contactTablesError}</p>
                        </div>
                      </div>
                    ) : upcomingTables.length === 0 ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                        <div className="text-center text-gray-500">
                          <p>Keine anstehenden Kontakttische gefunden.</p>
                          <p className="mt-2">Entdecke neue Kontakttische und nimm daran teil!</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {upcomingTables.map((table) => {
                            const { date, start_time } = formatDateTime(table.start_time);
                            return (
                              <li key={table.id}>
                                <Link href={`/contact-tables/${table.id}`} className="block hover:bg-gray-50">
                                  <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-indigo-600 truncate">
                                        {table.title}
                                      </p>
                                      <div className="ml-2 flex-shrink-0 flex">
                                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                          {table.participants?.length || 0}/{table.max_participants} Teilnehmer
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                      <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-500">
                                          <FiMapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                          {table.restaurant?.name || 'Unbekanntes Restaurant'}
                                        </p>
                                      </div>
                                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                        <FiClock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                        <p>
                                          {date} um {start_time}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Favorisierte Kontakttische */}
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Favorisierte Kontakttische</h2>
                    
                    {contactTablesLoading ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        </div>
                      </div>
                    ) : favoriteTables.length === 0 ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                        <div className="text-center text-gray-500">
                          <p>Keine favorisierten Kontakttische gefunden.</p>
                          <p className="mt-2">Füge Kontakttische zu deinen Favoriten hinzu, um sie hier zu sehen.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {favoriteTables.map((table) => {
                            const { date, start_time } = formatDateTime(table.start_time);
                            return (
                              <li key={table.id}>
                                <Link href={`/contact-tables/${table.id}`} className="block hover:bg-gray-50">
                                  <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-indigo-600 truncate">
                                        {table.title}
                                      </p>
                                      <div className="ml-2 flex-shrink-0 flex">
                                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                          {table.participants?.length || 0}/{table.max_participants} Teilnehmer
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                      <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-500">
                                          <FiMapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                          {table.restaurant?.name || 'Unbekanntes Restaurant'}
                                        </p>
                                      </div>
                                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                        <FiClock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                        <p>
                                          {date} um {start_time}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Button zum Anzeigen aller Kontakttische */}
                  <div className="mt-8 flex justify-center">
                    <Link href="/contact-tables">
                      <button
                        type="button"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Alle Kontakttische anzeigen
                      </button>
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
