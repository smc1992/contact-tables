import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FiUsers, FiHome, FiCalendar, FiAlertCircle, FiClock, FiDollarSign, FiBarChart2, 
  FiMessageSquare, FiStar, FiRefreshCw, FiCheck, FiAlertTriangle, FiFileText, FiSettings } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/client';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import NotificationCenter from '@/components/admin/NotificationCenter';
import { fetchDashboardData, fetchAnalyticsData, checkSystemStatusDirect, DashboardStats, ActivityItem } from '@/utils/supabase/dashboardQueries';
import AdminSidebar from '../../components/AdminSidebar';
import { formatDate } from '../../utils/dateUtils';
import { SupabaseClient } from '@supabase/supabase-js';

// Typen für Analytics und Systemstatus
interface AnalyticsData {
  userRegistrations: { labels: string[], data: number[] };
  restaurantRegistrations: { labels: string[], data: number[] };
  revenue: { labels: string[], data: number[] };
  userTypes: { labels: string[], data: number[] };
}

interface SystemStatus {
  api: { status: string, latency: number | null };
  database: { status: string, latency: number | null };
  paymentSystem: { status: string, latency: number | null };
  emailSystem: { status: string, latency: number | null };
}

export default function AdminDashboard() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('month');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    users: 0,
    restaurants: 0,
    pendingRequests: 0,
    activeRestaurants: 0,
    recentActivity: [],
    financialStats: {
      totalRevenue: 0,
      monthlyRevenue: 0,
      averageContractValue: 0,
      pendingPayments: 0
    },
    emailStats: {
      totalCampaigns: 0,
      totalSent: 0,
      recentCampaigns: []
    }
  });
  
  // Supabase-Client initialisieren
  const supabase = createClient();

  // Funktion zum Laden des Systemstatus direkt über Supabase
  const fetchSystemStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const status = await checkSystemStatusDirect(supabase);
      setSystemStatus(status);
    } catch (error) {
      console.error('Fehler beim Abrufen des Systemstatus:', error);
    } finally {
      setStatusLoading(false);
    }
  }, [supabase]);
  
  // Funktion zum Laden der Analytikdaten direkt über Supabase
  const fetchAnalyticsDataFromSupabase = useCallback(async (timeframe = 'month') => {
    setAnalyticsLoading(true);
    try {
      const data = await fetchAnalyticsData(supabase, timeframe);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Fehler beim Laden der Analytikdaten:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [supabase]);

  // Funktion zum Laden der Dashboard-Daten direkt über Supabase
  const fetchDashboardDataFromSupabase = useCallback(async () => {
    setRefreshing(true);
    try {
      // Direkte Supabase-Abfrage für Dashboard-Daten
      const data = await fetchDashboardData(supabase);
      
      // Daten in den State setzen
      setDashboardStats(data);
      setLastUpdated(new Date());
      
      // Systemstatus und Analytikdaten aktualisieren
      fetchSystemStatus();
      fetchAnalyticsDataFromSupabase(analyticsTimeframe);
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase, fetchSystemStatus, fetchAnalyticsDataFromSupabase, analyticsTimeframe]);

  // Echtzeit-Abonnement für Aktivitäten
  useEffect(() => {
    if (!session || !user || user.user_metadata?.role !== 'ADMIN') return;
    
    // Echtzeit-Abonnement für neue Restaurants
    const restaurantsSubscription = supabase
      .channel('restaurants-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'restaurants' }, 
        () => {
          console.log('Neue Restaurant-Registrierung erkannt');
          fetchDashboardDataFromSupabase();
        }
      )
      .subscribe();
      
    // Echtzeit-Abonnement für neue Verträge
    const contractsSubscription = supabase
      .channel('contracts-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'restaurant_contracts' }, 
        () => {
          console.log('Neuer Vertrag erkannt');
          fetchDashboardDataFromSupabase();
        }
      )
      .subscribe();
      
    // Echtzeit-Abonnement für neue Zahlungen
    const paymentsSubscription = supabase
      .channel('payments-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'payments' }, 
        () => {
          console.log('Neue Zahlung erkannt');
          fetchDashboardDataFromSupabase();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(restaurantsSubscription);
      supabase.removeChannel(contractsSubscription);
      supabase.removeChannel(paymentsSubscription);
    };
  }, [supabase, session, user, fetchDashboardDataFromSupabase]);

  // Initialisierung beim Laden der Seite
  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push('/auth/login');
      } else if (user && user.user_metadata?.role !== 'ADMIN') {
        router.push('/');
      } else {
        fetchDashboardDataFromSupabase();
      }
    }
  }, [authLoading, session, router, fetchDashboardDataFromSupabase, user]);

  // Ladeanzeige
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
        <AdminSidebar />
        <main className="flex-grow p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Letztes Update: {lastUpdated ? formatDate(lastUpdated) : 'Nie'}
                </span>
                <button
                  onClick={() => fetchDashboardDataFromSupabase()}
                  disabled={refreshing}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {refreshing ? (
                    <>
                      <FiRefreshCw className="animate-spin -ml-0.5 mr-2 h-4 w-4" />
                      Aktualisiere...
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="-ml-0.5 mr-2 h-4 w-4" />
                      Aktualisieren
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Dashboard Statistiken */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                      <FiUsers className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Registrierte Nutzer</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{dashboardStats.users}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <a href="/admin/users" className="font-medium text-indigo-600 hover:text-indigo-500">
                      Alle Nutzer anzeigen
                    </a>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <FiHome className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Restaurants</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{dashboardStats.restaurants}</div>
                          <span className="ml-2 text-sm text-gray-600">
                            ({dashboardStats.activeRestaurants} aktiv)
                          </span>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <a href="/admin/restaurants" className="font-medium text-indigo-600 hover:text-indigo-500">
                      Alle Restaurants anzeigen
                    </a>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                      <FiCalendar className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Offene Anfragen</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{dashboardStats.pendingRequests}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <a href="/admin/requests" className="font-medium text-indigo-600 hover:text-indigo-500">
                      Alle Anfragen anzeigen
                    </a>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                      <FiAlertCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">System Status</dt>
                        <dd className="flex items-baseline">
                          <div className="text-lg font-semibold text-gray-900">
                            {statusLoading ? (
                              <span className="text-gray-500">Prüfe...</span>
                            ) : systemStatus ? (
                              <div className="flex items-center">
                                {Object.values(systemStatus).every(s => s.status === 'operational') ? (
                                  <>
                                    <FiCheck className="text-green-500 mr-1" />
                                    <span className="text-green-500">Alle Systeme funktionieren</span>
                                  </>
                                ) : (
                                  <>
                                    <FiAlertTriangle className="text-yellow-500 mr-1" />
                                    <span className="text-yellow-500">Probleme erkannt</span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">Nicht verfügbar</span>
                            )}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <a href="/admin/system" className="font-medium text-indigo-600 hover:text-indigo-500">
                      Systemdetails anzeigen
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Aktivitäten und Finanzübersicht */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Aktivitäten */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Neueste Aktivitäten</h3>
                  <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                    {dashboardStats.recentActivity.length} Einträge
                  </span>
                </div>
                <div className="border-t border-gray-200">
                  <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                    {dashboardStats.recentActivity.length > 0 ? (
                      dashboardStats.recentActivity.map((activity, index) => (
                        <li key={index} className="px-4 py-3 sm:px-6 hover:bg-gray-50">
                          <div className="flex items-center">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                              <p className="text-sm text-gray-500">{activity.description}</p>
                              <p className="mt-1 text-xs text-gray-400">{activity.timestamp ? formatDate(new Date(activity.timestamp)) : 'Kein Datum'}</p>
                            </div>
                            <div className="ml-4">
                              {activity.type === 'registration' && <FiUsers className="text-indigo-500" />}
                              {activity.type === 'contract' && <FiFileText className="text-green-500" />}
                              {activity.type === 'payment' && <FiDollarSign className="text-yellow-500" />}
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-5 sm:px-6 text-center text-gray-500">Keine Aktivitäten gefunden</li>
                    )}
                  </ul>
                </div>
              </motion.div>

              {/* Finanzübersicht */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Finanzübersicht</h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Monatlicher Umsatz</dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(dashboardStats.financialStats.monthlyRevenue)}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Gesamtumsatz</dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(dashboardStats.financialStats.totalRevenue)}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Durchschnittlicher Vertragswert</dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(dashboardStats.financialStats.averageContractValue)}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Ausstehende Zahlungen</dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(dashboardStats.financialStats.pendingPayments)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </motion.div>
            </div>

            {/* Analytics und Schnellzugriff */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Analytics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white overflow-hidden shadow rounded-lg lg:col-span-2"
              >
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Analytics</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setAnalyticsTimeframe('week');
                        fetchAnalyticsDataFromSupabase('week');
                      }}
                      className={`px-3 py-1 text-xs rounded-full ${analyticsTimeframe === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      Woche
                    </button>
                    <button
                      onClick={() => {
                        setAnalyticsTimeframe('month');
                        fetchAnalyticsDataFromSupabase('month');
                      }}
                      className={`px-3 py-1 text-xs rounded-full ${analyticsTimeframe === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      Monat
                    </button>
                    <button
                      onClick={() => {
                        setAnalyticsTimeframe('year');
                        fetchAnalyticsDataFromSupabase('year');
                      }}
                      className={`px-3 py-1 text-xs rounded-full ${analyticsTimeframe === 'year' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      Jahr
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6 h-80">
                  {analyticsLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : analyticsData ? (
                    <AnalyticsCharts data={analyticsData} isLoading={false} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Keine Daten verfügbar
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Schnellzugriff */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Schnellzugriff</h3>
                </div>
                <div className="border-t border-gray-200">
                  <div className="divide-y divide-gray-200">
                    <a href="/admin/restaurants/add" className="block px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-100 rounded-md p-2">
                          <FiHome className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Restaurant hinzufügen</p>
                          <p className="text-sm text-gray-500">Neues Restaurant manuell anlegen</p>
                        </div>
                      </div>
                    </a>
                    <a href="/admin/users/manage" className="block px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-100 rounded-md p-2">
                          <FiUsers className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Nutzerverwaltung</p>
                          <p className="text-sm text-gray-500">Nutzer verwalten und Rollen zuweisen</p>
                        </div>
                      </div>
                    </a>
                    <a href="/admin/reports" className="block px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-yellow-100 rounded-md p-2">
                          <FiBarChart2 className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Berichte</p>
                          <p className="text-sm text-gray-500">Detaillierte Berichte und Statistiken</p>
                        </div>
                      </div>
                    </a>
                    <a href="/admin/settings" className="block px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-gray-100 rounded-md p-2">
                          <FiSettings className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Einstellungen</p>
                          <p className="text-sm text-gray-500">Systemeinstellungen anpassen</p>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Benachrichtigungszentrum */}
            <div className="mt-8">
              <NotificationCenter />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
