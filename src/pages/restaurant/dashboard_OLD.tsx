import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

interface ContactTable {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  max_participants: number;
  current_participants?: number; // Optional, falls wir das später laden
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  created_at?: string;
  updated_at?: string;
}

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'INACTIVE';
  // Weitere Felder können hier bei Bedarf hinzugefügt werden
  created_at?: string;
  updated_at?: string;
}

export default function RestaurantDashboard() {
  const supabase = getSupabaseBrowserClient();
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurantDataLoading, setRestaurantDataLoading] = useState(true);
  const [contactTablesTodayCount, setContactTablesTodayCount] = useState<number | null>(null);
  const [contactTablesTodayLoading, setContactTablesTodayLoading] = useState(true);
  const [upcomingContactTables, setUpcomingContactTables] = useState<ContactTable[] | null>(null);
  const [upcomingContactTablesLoading, setUpcomingContactTablesLoading] = useState(true);
  
  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push('/auth/login');
      } else if (user && user.user_metadata?.role !== 'RESTAURANT') {
        router.push('/');
      } else {
        setLoading(false);
      }
    }
  }, [session, user, authLoading, router]);

  // useEffect to fetch restaurant data once user is authenticated and identified as RESTAURANT
  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (user && user.id) {
        setRestaurantDataLoading(true);
        try {
          const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            if (error.code === 'PGRST116') { // No row found
              console.warn(`No restaurant profile found for user ${user.id}.`);
              setRestaurant(null);
            } else {
              console.error('Error fetching restaurant data:', error.message);
            }
          } else if (data) {
            setRestaurant(data as Restaurant);
          }
        } catch (e: any) {
          console.error('Unexpected error during restaurant data fetch:', e.message);
        } finally {
          setRestaurantDataLoading(false);
        }
      } else {
        setRestaurantDataLoading(false); // No user or user.id, so can't fetch
      }
    };

    if (!authLoading && session && user && user.user_metadata?.role === 'RESTAURANT') {
      fetchRestaurantData();
    } else if (!authLoading) {
      // If auth is done but conditions not met (e.g., not a restaurant, no session), stop loading for restaurant data.
      setRestaurantDataLoading(false);
    }
  }, [user, authLoading, session, supabase]);

  // useEffect to fetch count of today's contact tables
  useEffect(() => {
    const fetchTodaysContactTablesCount = async () => {
      if (!restaurant || !restaurant.id) return;

      setContactTablesTodayLoading(true);
      try {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

        const { count, error } = await supabase
          .from('contact_tables')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id)
          .gte('start_time', startDate)
          .lt('start_time', endDate);

        if (error) {
          console.error("Error fetching today's contact tables count:", error.message);
          setContactTablesTodayCount(null);
        } else {
          setContactTablesTodayCount(count);
        }
      } catch (e: any) {
        console.error('Unexpected error fetching contact tables count:', e.message);
        setContactTablesTodayCount(null);
      } finally {
        setContactTablesTodayLoading(false);
      }
    };

    if (restaurant && !restaurantDataLoading) {
      fetchTodaysContactTablesCount();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant, restaurantDataLoading, supabase]);

  // useEffect to fetch upcoming contact tables
  useEffect(() => {
    const fetchUpcomingContactTables = async () => {
      if (!restaurant || !restaurant.id) return;

      setUpcomingContactTablesLoading(true);
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('contact_tables')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .gte('start_time', now) // Nur zukünftige oder gerade laufende Tische
          .order('start_time', { ascending: true })
          .limit(5); // Begrenzung auf 5 Tische

        if (error) {
          console.error('Error fetching upcoming contact tables:', error.message);
          setUpcomingContactTables(null);
        } else {
          setUpcomingContactTables(data as ContactTable[]);
        }
      } catch (e: any) {
        console.error('Unexpected error fetching upcoming contact tables:', e.message);
        setUpcomingContactTables(null);
      } finally {
        setUpcomingContactTablesLoading(false);
      }
    };

    if (restaurant && !restaurantDataLoading) {
      fetchUpcomingContactTables();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant, restaurantDataLoading, supabase]);

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
      <main className="flex-grow bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {restaurantDataLoading ? 'Lade Dashboard...' : (restaurant ? `Dashboard von ${restaurant.name}` : 'Restaurant Dashboard')}
              </h1>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => router.push('/restaurant/profile')}
              >
                Profil bearbeiten
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Statistik-Karten */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Kontakttische heute</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                          {contactTablesTodayLoading ? '...' : (contactTablesTodayCount !== null ? contactTablesTodayCount : 'N/A')}
                        </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <a href="/restaurant/events" className="font-medium text-indigo-600 hover:text-indigo-500">Alle Kontakttische anzeigen</a>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Profilaufrufe</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">128</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <a href="/restaurant/statistics" className="font-medium text-indigo-600 hover:text-indigo-500">Statistiken anzeigen</a>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Abonnement</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">Aktiv</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <a href="/restaurant/subscription" className="font-medium text-indigo-600 hover:text-indigo-500">Abonnement verwalten</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Aktuelle Kontakttische */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Aktuelle Kontakttische</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {upcomingContactTablesLoading && (
                    <li><div className="px-4 py-4 sm:px-6 text-center text-gray-500">Lade Kontakttische...</div></li>
                  )}
                  {!upcomingContactTablesLoading && upcomingContactTables && upcomingContactTables.length === 0 && (
                    <li><div className="px-4 py-4 sm:px-6 text-center text-gray-500">Keine bevorstehenden Kontakttische gefunden.</div></li>
                  )}
                  {!upcomingContactTablesLoading && upcomingContactTables && upcomingContactTables.map((table) => (
                    <li key={table.id}>
                      <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-indigo-600 truncate">{table.name}</p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${table.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                              {new Date(table.start_time).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a3.001 3.001 0 00-2.824 2H10V8.5A2.5 2.5 0 007.5 6h-1A1.5 1.5 0 005 7.5v1A1.5 1.5 0 006.5 10h1A2.5 2.5 0 0010 12.5v3.382l-1.97.985A1.5 1.5 0 007 18.254V19.5a.5.5 0 001 0v-1.246l1.97-.985A1.5 1.5 0 0011 15.914V12.5a2.5 2.5 0 002.5-2.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1z" />
                              </svg>
                              {table.max_participants} Plätze
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <p>
                              <time dateTime={table.start_time}>{new Date(table.start_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</time>
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                  {!upcomingContactTablesLoading && !upcomingContactTables && (
                     <li><div className="px-4 py-4 sm:px-6 text-center text-gray-500">Fehler beim Laden der Kontakttische.</div></li>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
