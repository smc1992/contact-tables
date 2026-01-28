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
import { type Database } from '../../types/supabase';

type ContactTable = Database['public']['Tables']['contact_tables']['Row'];

interface ContactTableWithDetails extends ContactTable {
  restaurant?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    postal_code?: string;
  } | null;
  participants?: any[] | null;
  datetime: string; // Vorhandenes Feld für Datum und Uhrzeit
  date?: string; // Optionales Feld für Datum
}

export default function CustomerDashboard() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contactTablesLoading, setContactTablesLoading] = useState(true);
  const [contactTablesError, setContactTablesError] = useState<string | null>(null);
  const [upcomingTables, setUpcomingTables] = useState<ContactTableWithDetails[]>([]);
  const [favoriteTables, setFavoriteTables] = useState<ContactTableWithDetails[]>([]);
  
  // Paginierungsvariablen für anstehende Kontakttische
  const [upcomingCurrentPage, setUpcomingCurrentPage] = useState(1);
  const [upcomingItemsPerPage, setUpcomingItemsPerPage] = useState(5);
  const [upcomingTotalPages, setUpcomingTotalPages] = useState(1);
  const [upcomingTotalCount, setUpcomingTotalCount] = useState(0);
  
  // Paginierungsvariablen für favorisierte Kontakttische
  const [favoriteCurrentPage, setFavoriteCurrentPage] = useState(1);
  const [favoriteItemsPerPage, setFavoriteItemsPerPage] = useState(5);
  const [favoriteTotalPages, setFavoriteTotalPages] = useState(1);
  const [favoriteTotalCount, setFavoriteTotalCount] = useState(0);
  
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
          .select('event_id')
          .eq('user_id', user.id);
        
        if (participationsError) {
          console.error('Fehler beim Laden der Teilnahmen:', participationsError);
        } else if (participations && participations.length > 0) {
          // IDs der Kontakttische extrahieren
          const tableIds = participations.map(p => p.event_id);
          
          // Gesamtanzahl der Kontakttische für Paginierung ermitteln
          const { count: upcomingCount, error: upcomingCountError } = await supabase
            .from('contact_tables')
            .select('id', { count: 'exact' })
            .in('id', tableIds);
            
          if (upcomingCountError) {
            console.error('Fehler beim Zählen der Kontakttische:', upcomingCountError);
          } else {
            // Berechnung der Gesamtseitenzahl
            const total = upcomingCount || 0;
            const calculatedTotalPages = Math.ceil(total / upcomingItemsPerPage);
            setUpcomingTotalCount(total);
            setUpcomingTotalPages(calculatedTotalPages || 1);
          }
          
          // Berechnung des Offsets für die Paginierung
          const from = (upcomingCurrentPage - 1) * upcomingItemsPerPage;
          const to = from + upcomingItemsPerPage - 1;
          
          // Kontakttische mit Details und Paginierung abrufen
          const { data: tables, error: tablesError } = await supabase
            .from('contact_tables')
            .select(`
              *,
              restaurant:restaurant_id(*)
            `)
            .in('id', tableIds)
            .order('datetime', { ascending: true })
            .range(from, to);
          
          if (tablesError) {
            console.error('Fehler beim Laden der Kontakttische:', tablesError);
          } else {
            console.log('Dashboard: Loaded tables:', tables);
            
            // Für jeden Kontakttisch die Teilnehmer laden
            const tablesWithParticipants = await Promise.all((tables || []).map(async (table) => {
              console.log(`Dashboard: Loading participants for table ${table.id}, datetime:`, table.datetime);
              
              const { data: participants, error: participantsError } = await supabase
                .from('participations')
                .select('user_id, reservation_date')
                .eq('event_id', table.id);
                
              if (participantsError) {
                console.error(`Fehler beim Laden der Teilnehmer für Tisch ${table.id}:`, participantsError);
                return { ...table, participants: [], userReservationDate: null };
              }
              
              // Finde die Reservierung des aktuellen Benutzers
              const userParticipation = participants?.find(p => p.user_id === user?.id);
              const userReservationDate = userParticipation?.reservation_date || null;
              
              console.log(`Dashboard: Participants for table ${table.id}:`, participants);
              console.log(`Dashboard: User reservation date:`, userReservationDate);
              
              return { 
                ...table, 
                participants: participants || [],
                userReservationDate
              };
            }));
            
            console.log('Dashboard: Final tables with participants:', tablesWithParticipants);
            setUpcomingTables(tablesWithParticipants);
          }
        } else {
          setUpcomingTables([]);
          setUpcomingTotalCount(0);
          setUpcomingTotalPages(1);
        }
      } catch (err) {
        console.error('Fehler beim Laden der anstehenden Tische:', err);
        setUpcomingTables([]);
        setUpcomingTotalCount(0);
        setUpcomingTotalPages(1);
      }
      
      // 2. Dann die favorisierten Kontakttische laden
      try {
        // Favorisierte Restaurants abrufen
        const { data: favorites, error: favoritesError } = await supabase
          .from('favorites')
          .select('restaurant_id')
          .eq('user_id', user.id);
        
        if (favoritesError) {
          console.error('Fehler beim Laden der Favoriten:', favoritesError);
        } else if (favorites && favorites.length > 0) {
          // IDs der favorisierten Restaurants extrahieren
          const favoriteIds = favorites.map(f => f.restaurant_id);
          
          // Gesamtanzahl der favorisierten Kontakttische für Paginierung ermitteln
          const { count: favoriteCount, error: favoriteCountError } = await supabase
            .from('contact_tables')
            .select('id', { count: 'exact' })
            .in('restaurant_id', favoriteIds);
            
          if (favoriteCountError) {
            console.error('Fehler beim Zählen der favorisierten Kontakttische:', favoriteCountError);
          } else {
            // Berechnung der Gesamtseitenzahl
            const total = favoriteCount || 0;
            const calculatedTotalPages = Math.ceil(total / favoriteItemsPerPage);
            setFavoriteTotalCount(total);
            setFavoriteTotalPages(calculatedTotalPages || 1);
          }
          
          // Berechnung des Offsets für die Paginierung
          const from = (favoriteCurrentPage - 1) * favoriteItemsPerPage;
          const to = from + favoriteItemsPerPage - 1;
          
          // Favorisierte Kontakttische mit Details und Paginierung abrufen
          const { data: favoriteTables, error: favoriteTablesError } = await supabase
            .from('contact_tables')
            .select(`
              *,
              restaurant:restaurant_id(*)
            `)
            .in('restaurant_id', favoriteIds)
            .order('datetime', { ascending: true })
            .range(from, to);
          
          if (favoriteTablesError) {
            console.error('Fehler beim Laden der favorisierten Kontakttische:', favoriteTablesError);
          } else {
            setFavoriteTables(favoriteTables || []);
          }
        } else {
          setFavoriteTables([]);
          setFavoriteTotalCount(0);
          setFavoriteTotalPages(1);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Favoriten:', err);
        setFavoriteTables([]);
        setFavoriteTotalCount(0);
        setFavoriteTotalPages(1);
      }
      
      // Lade-Status beenden, unabhängig vom Ergebnis
      setContactTablesLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      setContactTablesError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.');
      setContactTablesLoading(false);
    }
  };

  // Seitenwechsel-Funktionen für anstehende Kontakttische
  const goToUpcomingPage = (page: number) => {
    if (page >= 1 && page <= upcomingTotalPages) {
      setUpcomingCurrentPage(page);
    }
  };

  const goToNextUpcomingPage = () => {
    if (upcomingCurrentPage < upcomingTotalPages) {
      setUpcomingCurrentPage(upcomingCurrentPage + 1);
    }
  };

  const goToPreviousUpcomingPage = () => {
    if (upcomingCurrentPage > 1) {
      setUpcomingCurrentPage(upcomingCurrentPage - 1);
    }
  };
  
  // Seitenwechsel-Funktionen für favorisierte Kontakttische
  const goToFavoritePage = (page: number) => {
    if (page >= 1 && page <= favoriteTotalPages) {
      setFavoriteCurrentPage(page);
    }
  };

  const goToNextFavoritePage = () => {
    if (favoriteCurrentPage < favoriteTotalPages) {
      setFavoriteCurrentPage(favoriteCurrentPage + 1);
    }
  };

  const goToPreviousFavoritePage = () => {
    if (favoriteCurrentPage > 1) {
      setFavoriteCurrentPage(favoriteCurrentPage - 1);
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
  
  // Effekt für das Neuladen der Daten bei Änderung der Paginierung
  useEffect(() => {
    if (user && !loading) {
      loadParticipatingTables();
    }
  }, [upcomingCurrentPage, upcomingItemsPerPage, favoriteCurrentPage, favoriteItemsPerPage]);

  if (loading) {
    return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex flex-col md:flex-row">
        <CustomerSidebar activePage="dashboard" />
        <main className="flex-grow bg-gray-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
    );
  }

  // Formatierungsfunktion für Datum und Uhrzeit
  const formatDateTime = (dateString: string) => {
    if (!dateString) {
      return {
        date: 'Invalid Date',
        start_time: 'Invalid Date'
      };
    }
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return {
        date: 'Invalid Date',
        start_time: 'Invalid Date'
      };
    }
    
    return {
      date: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      start_time: date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex flex-col md:flex-row">
        <CustomerSidebar activePage="dashboard" />
        <main className="flex-grow bg-gray-50 p-4 md:p-6">
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mein Dashboard</h1>
                    <Link href="/contact-tables">
                      <button
                        type="button"
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FiStar className="mr-2" />
                        <span className="hidden sm:inline">Neue Kontakttische entdecken</span>
                        <span className="sm:hidden">Entdecken</span>
                      </button>
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:gap-6">
                    {/* Statistik-Karten */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-4 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                            <FiCalendar className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Anstehende Kontakttische</dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">{upcomingTotalCount}</div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Anstehende Kontakttische */}
                  <div className="mt-6 md:mt-8">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Anstehende Kontakttische</h2>
                    
                    {contactTablesLoading ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        </div>
                      </div>
                    ) : upcomingTables.length === 0 ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                        <div className="text-center text-gray-500">
                          <p>Keine anstehenden Kontakttische gefunden.</p>
                          <p className="mt-2">Melde dich für Kontakttische an, um sie hier zu sehen.</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {upcomingTables.map((table) => {
                              // Verwende userReservationDate für flexible Events, sonst datetime
                              const dateToUse = table.userReservationDate || table.datetime;
                              const { date, start_time } = dateToUse 
                                ? formatDateTime(dateToUse) 
                                : { date: 'Flexibel', start_time: 'nach Vereinbarung' };
                              
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
                        
                        {upcomingTables.length > 0 && (
                          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                              <button
                                onClick={goToPreviousUpcomingPage}
                                disabled={upcomingCurrentPage === 1}
                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${upcomingCurrentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                              >
                                Zurück
                              </button>
                              <button
                                onClick={goToNextUpcomingPage}
                                disabled={upcomingCurrentPage === upcomingTotalPages}
                                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${upcomingCurrentPage === upcomingTotalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                              >
                                Weiter
                              </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm text-gray-700">
                                  Zeige <span className="font-medium">{upcomingTables.length > 0 ? (upcomingCurrentPage - 1) * upcomingItemsPerPage + 1 : 0}</span> bis <span className="font-medium">{Math.min(upcomingCurrentPage * upcomingItemsPerPage, upcomingTotalCount)}</span> von <span className="font-medium">{upcomingTotalCount}</span> Kontakttischen
                                </p>
                              </div>
                              <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                  <button
                                    onClick={goToPreviousUpcomingPage}
                                    disabled={upcomingCurrentPage === 1}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 ${upcomingCurrentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                  >
                                    <span className="sr-only">Zurück</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  
                                  {/* Seitenzahlen */}
                                  {Array.from({ length: upcomingTotalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                      key={`upcoming-page-${page}`}
                                      onClick={() => goToUpcomingPage(page)}
                                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 ${page === upcomingCurrentPage ? 'bg-indigo-50 text-indigo-600 font-medium' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                    >
                                      {page}
                                    </button>
                                  ))}
                                  
                                  <button
                                    onClick={goToNextUpcomingPage}
                                    disabled={upcomingCurrentPage === upcomingTotalPages}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 ${upcomingCurrentPage === upcomingTotalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                  >
                                    <span className="sr-only">Weiter</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </nav>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Favorisierte Kontakttische */}
                  <div className="mt-6 md:mt-8">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Favorisierte Kontakttische</h2>
                    
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
                      <>
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {favoriteTables.map((table) => {
                              const { date, start_time } = formatDateTime(table.datetime || new Date().toISOString());
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
                        
                        {favoriteTables.length > 0 && (
                          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                              <button
                                onClick={goToPreviousFavoritePage}
                                disabled={favoriteCurrentPage === 1}
                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${favoriteCurrentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                              >
                                Zurück
                              </button>
                              <button
                                onClick={goToNextFavoritePage}
                                disabled={favoriteCurrentPage === favoriteTotalPages}
                                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${favoriteCurrentPage === favoriteTotalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                              >
                                Weiter
                              </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm text-gray-700">
                                  Zeige <span className="font-medium">{favoriteTables.length > 0 ? (favoriteCurrentPage - 1) * favoriteItemsPerPage + 1 : 0}</span> bis <span className="font-medium">{Math.min(favoriteCurrentPage * favoriteItemsPerPage, favoriteTotalCount)}</span> von <span className="font-medium">{favoriteTotalCount}</span> Kontakttischen
                                </p>
                              </div>
                              <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                  <button
                                    onClick={goToPreviousFavoritePage}
                                    disabled={favoriteCurrentPage === 1}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 ${favoriteCurrentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                  >
                                    <span className="sr-only">Zurück</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  
                                  {/* Seitenzahlen */}
                                  {Array.from({ length: favoriteTotalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                      key={`favorite-page-${page}`}
                                      onClick={() => goToFavoritePage(page)}
                                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 ${page === favoriteCurrentPage ? 'bg-indigo-50 text-indigo-600 font-medium' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                    >
                                      {page}
                                    </button>
                                  ))}
                                  
                                  <button
                                    onClick={goToNextFavoritePage}
                                    disabled={favoriteCurrentPage === favoriteTotalPages}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 ${favoriteCurrentPage === favoriteTotalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                  >
                                    <span className="sr-only">Weiter</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </nav>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Button zum Anzeigen aller Kontakttische */}
                  <div className="mt-6 md:mt-8 flex justify-center">
                    <Link href="/contact-tables" className="w-full sm:w-auto">
                      <button
                        type="button"
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
