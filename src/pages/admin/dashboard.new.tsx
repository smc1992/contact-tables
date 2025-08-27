import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FiUsers, FiHome, FiCalendar, FiAlertCircle, FiClock, FiDollarSign, FiBarChart2, FiMessageSquare, FiStar, FiRefreshCw, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/client';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import NotificationCenter, { AdminNotification } from '@/components/admin/NotificationCenter';
import { fetchDashboardData as fetchDashboardDataDirect, fetchAnalyticsData as fetchAnalyticsDataDirect, checkSystemStatusDirect, DashboardStats, ActivityItem } from '@/utils/supabase/dashboardQueries';
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
  const fetchAnalyticsData = useCallback(async (timeframe = 'month') => {
    setAnalyticsLoading(true);
    try {
      const data = await fetchAnalyticsDataDirect(supabase, timeframe);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Fehler beim Laden der Analytikdaten:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [supabase]);

  // Funktion zum Laden der Dashboard-Daten direkt über Supabase
  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      // Direkte Supabase-Abfrage für Dashboard-Daten
      const data = await fetchDashboardDataDirect(supabase);
      
      // Daten in den State setzen
      setDashboardStats(data);
      setLastUpdated(new Date());
      
      // Systemstatus und Analytikdaten aktualisieren
      fetchSystemStatus();
      fetchAnalyticsData(analyticsTimeframe);
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase, fetchSystemStatus, fetchAnalyticsData, analyticsTimeframe]);

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
          fetchDashboardData();
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
          fetchDashboardData();
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
          fetchDashboardData();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(restaurantsSubscription);
      supabase.removeChannel(contractsSubscription);
      supabase.removeChannel(paymentsSubscription);
    };
  }, [supabase, session, user, fetchDashboardData]);

  // Initialisierung beim Laden der Seite
  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push('/auth/login');
      } else if (user && user.user_metadata?.role !== 'ADMIN') {
        router.push('/');
      } else {
        fetchDashboardData();
      }
    }
  }, [authLoading, session, router, fetchDashboardData, user]);

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
      <div className="flex flex-col md:flex-row flex-grow">
        <AdminSidebar activeItem="dashboard" />
        
        <main className="flex-grow bg-gray-50 py-6 px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="flex items-center space-x-4">
                <NotificationCenter 
                  onNotificationClick={(notification: AdminNotification) => {
                    // Aktion bei Klick auf eine Benachrichtigung
                    console.log('Benachrichtigung angeklickt:', notification);
                    if (notification.action_url) {
                      router.push(notification.action_url);
                    }
                  }}
                />
                <div className="flex items-center space-x-2">
                  {lastUpdated && (
                    <span className="text-sm text-gray-500">
                      Letztes Update: {lastUpdated.toLocaleTimeString('de-DE')}
                    </span>
                  )}
                  <button 
                    onClick={fetchDashboardData}
                    disabled={refreshing}
                    className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Statistik-Karten */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                      <FiUsers className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Benutzer</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{dashboardStats.users}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <a href="/admin/users" className="font-medium text-indigo-600 hover:text-indigo-500">Alle Benutzer anzeigen</a>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                      <FiHome className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Restaurants</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{dashboardStats.restaurants}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <a href="/admin/restaurants" className="font-medium text-indigo-600 hover:text-indigo-500">Alle Restaurants anzeigen</a>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                      <FiAlertCircle className="h-6 w-6 text-white" />
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
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <a href="/admin/partner-requests" className="font-medium text-indigo-600 hover:text-indigo-500">Anfragen bearbeiten</a>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <FiDollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Aktive Restaurants</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{dashboardStats.activeRestaurants}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <a href="/admin/contact-tables" className="font-medium text-indigo-600 hover:text-indigo-500">Contact Tables anzeigen</a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Weitere Dashboard-Inhalte hier */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Analytics</h2>
                {analyticsData ? (
                  <AnalyticsCharts data={analyticsData} isLoading={analyticsLoading} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Keine Analytics-Daten verfügbar</p>
                  </div>
                )}
              </div>
              
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Letzte Aktivitäten</h2>
                <div className="space-y-4">
                  {dashboardStats.recentActivity && dashboardStats.recentActivity.length > 0 ? (
                    dashboardStats.recentActivity.map((activity, index) => (
                      <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                        <h3 className="font-medium">{activity.title || 'Aktivität'}</h3>
                        <p className="text-sm text-gray-600">{activity.description || 'Keine Beschreibung'}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {activity.timestamp ? formatDate(new Date(activity.timestamp)) : 'Kein Datum'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-gray-500">Keine Aktivitäten vorhanden</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
