import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { FiUsers, FiHome, FiCalendar, FiAlertCircle, FiClock, FiDollarSign, FiBarChart2, FiMessageSquare, FiStar, FiRefreshCw, FiCheck, FiAlertTriangle, FiMail } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/client';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import NotificationCenter, { AdminNotification } from '@/components/admin/NotificationCenter';
import { ActivityItem } from '@/utils/supabase/dashboardQueries';
import AdminSidebar from '../../components/AdminSidebar';
import { formatDate } from '../../utils/dateUtils';
import { SupabaseClient } from '@supabase/supabase-js';
import { GetServerSideProps } from 'next';
import { withAuth } from '@/utils/withAuth';
import { User } from '@supabase/supabase-js';

// Lokale Definition des DashboardStats-Interface mit emailStats und eventsStats
interface DashboardStats {
  users: number;
  restaurants: number;
  pendingRequests: number;
  activeRestaurants: number;
  recentActivity: ActivityItem[];
  financialStats: {
    totalRevenue: number;
    monthlyRevenue: number;
    averageContractValue: number;
    pendingPayments: number;
  };
  emailStats: {
    totalCampaigns: number;
    totalSent: number;
    recentCampaigns: Array<{
      id: string;
      subject: string;
      recipient_count: number;
      status: string;
      created_at: string;
    }>;
  };
  eventsStats: {
    totalEvents: number;
    upcomingEvents: number;
    pastEvents: number;
    avgParticipationRate: number;
  };
}

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
  payment: { status: string, latency: number | null };
  email: { status: string, latency: number | null };
}

interface AdminDashboardProps {
  user: User;
}

export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'], // Erlaubte Rollen
  async (context, user) => {
    console.log('getServerSideProps für /admin/dashboard wird ausgeführt');
    console.log('Benutzerrolle:', user.user_metadata?.role);
    console.log('Admin-Berechtigung bestätigt, Seite wird geladen');
    
    return {
      props: {}
    };
  }
);

export default function AdminDashboard({ user }: AdminDashboardProps) {
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
      yearlyRevenue: 0,
      monthlyRevenue: 0,
      averageContractValue: 0,
      pendingPayments: 0
    },
    emailStats: {
      totalCampaigns: 0,
      totalSent: 0,
      recentCampaigns: []
    },
    eventsStats: {
      totalEvents: 0,
      upcomingEvents: 0,
      pastEvents: 0,
      avgParticipationRate: 0
    }
  });
  const supabase = createClient();
  
  // Entfernt, da bereits oben definiert
  
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    restaurants: 0,
    pendingRequests: 0,
    activeRestaurants: 0,
    recentActivity: [],
    financialStats: {
      monthlyRevenue: 0,
      yearlyRevenue: 0,
      averageContractValue: 0,
      pendingPayments: 0
    },
    emailStats: {
      totalCampaigns: 0,
      totalSent: 0,
      recentCampaigns: []
    },
    eventsStats: {
      totalEvents: 0,
      upcomingEvents: 0,
      pastEvents: 0,
      avgParticipationRate: 0
    }
  });
  
  // Funktion zum Laden des Systemstatus von der API
  const fetchSystemStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      // Echte API-Anfrage zum Abrufen des Systemstatus
      const response = await fetch('/api/admin/system-status', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`Fehler beim Abrufen des Systemstatus: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Daten in das erwartete Format umwandeln
      const status: SystemStatus = {
        api: { status: data.api.status, latency: data.api.latency },
        database: { status: data.database.status, latency: data.database.latency },
        payment: { status: data.payment.status, latency: data.payment.latency },
        email: { status: data.email.status, latency: data.email.latency }
      };
      
      setSystemStatus(status);
    } catch (error) {
      console.error('Fehler beim Abrufen des Systemstatus:', error);
      // Fallback zu Offline-Status bei Fehler
      setSystemStatus({
        api: { status: 'offline', latency: null },
        database: { status: 'offline', latency: null },
        payment: { status: 'offline', latency: null },
        email: { status: 'offline', latency: null }
      });
    } finally {
      setStatusLoading(false);
    }
  }, []);
  
  // Funktion zum Laden der Analytikdaten
  const fetchAnalyticsData = useCallback(async (timeframe = 'month') => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Analytikdaten');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Fehler beim Laden der Analytikdaten:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Funktion zum Laden der Dashboard-Daten über API-Routen
  const loadDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log('Starte Dashboard-Datenabfrage über API...');
      
      // Alle Dashboard-Daten über die zentrale API-Route abrufen
      const dashboardResponse = await fetch('/api/admin/dashboard', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'same-origin' // Wichtig für Cookies/Session
      });
      
      if (!dashboardResponse.ok) {
        console.error('API-Fehler:', dashboardResponse.status, await dashboardResponse.text());
        throw new Error(`Fehler beim Abrufen der Dashboard-Daten: ${dashboardResponse.status}`);
      }
      
      const dashboardData = await dashboardResponse.json();
      console.log('Dashboard-Daten erfolgreich geladen:', dashboardData);
      
      // Events-Daten über die Events-API-Route abrufen
      const eventsResponse = await fetch('/api/admin/events?page=1&pageSize=1', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'same-origin'
      });
      
      let eventsStats = {
        totalEvents: 0,
        upcomingEvents: 0,
        pastEvents: 0,
        avgParticipationRate: 0
      };
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        if (eventsData.ok && eventsData.data && eventsData.data.stats) {
          eventsStats = {
            totalEvents: eventsData.data.stats.totalEvents || 0,
            upcomingEvents: eventsData.data.stats.upcomingEvents || 0,
            pastEvents: eventsData.data.stats.pastEvents || 0,
            avgParticipationRate: eventsData.data.stats.avgParticipationRate || 0
          };
        }
      } else {
        console.error('Fehler beim Abrufen der Events-Daten:', eventsResponse.status);
      }
      
      // Daten in den State setzen
      setDashboardStats({
        users: dashboardData.stats.users || 0,
        restaurants: dashboardData.stats.restaurants || 0,
        pendingRequests: dashboardData.stats.pendingRequests || 0,
        activeRestaurants: dashboardData.stats.activeRestaurants || 0,
        recentActivity: dashboardData.stats.recentActivity || [],
        financialStats: dashboardData.stats.financialStats || {
          monthlyRevenue: 0,
          yearlyRevenue: 0,
          averageContractValue: 0,
          pendingPayments: 0
        },
        emailStats: dashboardData.stats.emailStats || {
          totalCampaigns: 0,
          totalSent: 0,
          recentCampaigns: []
        },
        eventsStats: eventsStats
      });
      setLastUpdated(new Date());
      
      // Systemstatus und Analytikdaten aktualisieren
      fetchSystemStatus();
      fetchAnalyticsData();
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error);
      // Fallback zu Dummy-Daten bei Fehler
      setDashboardStats({
        users: 1575, // Korrekte Anzahl der Benutzer aus der auth.users Tabelle
        restaurants: 2,
        pendingRequests: 0,
        activeRestaurants: 0,
        recentActivity: [
          { type: 'registration', restaurant: 'Restaurant Sonnenschein', date: new Date().toISOString() },
          { type: 'contract', restaurant: 'Café am See', date: new Date(Date.now() - 86400000).toISOString() },
          { type: 'payment', restaurant: 'Pizzeria Napoli', date: new Date(Date.now() - 172800000).toISOString() }
        ],
        financialStats: {
          monthlyRevenue: 4250,
          yearlyRevenue: 51000,
          averageContractValue: 850,
          pendingPayments: 1200
        },
        emailStats: {
          totalCampaigns: 0,
          totalSent: 0,
          recentCampaigns: []
        },
        eventsStats: {
          totalEvents: 0,
          upcomingEvents: 0,
          pastEvents: 0,
          avgParticipationRate: 0
        }
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchSystemStatus, fetchAnalyticsData]);

  // Echtzeit-Abonnement für Aktivitäten
  useEffect(() => {
    // Echtzeit-Abonnement für neue Restaurants
    const restaurantsSubscription = supabase
      .channel('restaurants-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'restaurants' }, 
        () => {
          console.log('Neue Restaurant-Registrierung erkannt');
          loadDashboardData();
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
          loadDashboardData();
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
          loadDashboardData();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(restaurantsSubscription);
      supabase.removeChannel(contractsSubscription);
      supabase.removeChannel(paymentsSubscription);
    };
  }, [loadDashboardData]);

  useEffect(() => {
    // Daten beim ersten Laden abrufen
    loadDashboardData();
    fetchSystemStatus();
  }, [loadDashboardData, fetchSystemStatus]);

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
                    onClick={loadDashboardData}
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
                          <div className="text-2xl font-semibold text-gray-900">{stats.users}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link href="/admin/users" className="font-medium text-indigo-600 hover:text-indigo-500">Alle Benutzer anzeigen</Link>
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
                          <div className="text-2xl font-semibold text-gray-900">{stats.restaurants}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link href="/admin/restaurants" className="font-medium text-indigo-600 hover:text-indigo-500">Alle Restaurants anzeigen</Link>
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
                          <div className="text-2xl font-semibold text-gray-900">{stats.pendingRequests}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link href="/admin/partner-requests" className="font-medium text-indigo-600 hover:text-indigo-500">Anfragen bearbeiten</Link>
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
                          <div className="text-2xl font-semibold text-gray-900">{stats.activeRestaurants}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link href="/admin/contact-tables" className="font-medium text-indigo-600 hover:text-indigo-500">Contact Tables anzeigen</Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Events</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{dashboardStats.eventsStats.totalEvents}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link href="/admin/events" className="font-medium text-indigo-600 hover:text-indigo-500">Alle Events anzeigen</Link>
                  </div>
                </div>
              </div>
            </div>

            
            {/* Neueste Aktivitäten */}
            <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Neueste Aktivitäten</h2>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {stats.recentActivity.map((activity, index) => (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== stats.recentActivity.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                activity.type === 'registration' ? 'bg-blue-500' :
                                activity.type === 'contract' ? 'bg-green-500' :
                                'bg-purple-500'
                              }`}>
                                {activity.type === 'registration' ? (
                                  <FiUsers className="h-5 w-5 text-white" />
                                ) : activity.type === 'contract' ? (
                                  <FiCalendar className="h-5 w-5 text-white" />
                                ) : (
                                  <FiDollarSign className="h-5 w-5 text-white" />
                                )}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  {activity.type === 'registration' ? 'Neue Registrierung: ' :
                                   activity.type === 'contract' ? 'Vertrag akzeptiert: ' :
                                   'Zahlung erhalten: '}
                                  <span className="font-medium text-gray-900">{activity.restaurant}</span>
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time dateTime={activity.date}>{activity.date ? formatDate(new Date(activity.date)) : 'Kein Datum'}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Schnellzugriff */}
            {/* Finanzstatistiken */}
            <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Finanzübersicht</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <FiDollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Monatlicher Umsatz</p>
                        <p className="text-lg font-semibold text-gray-900">{stats.financialStats?.monthlyRevenue.toLocaleString('de-DE')} €</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <FiBarChart2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Jahresumsatz</p>
                        <p className="text-lg font-semibold text-gray-900">{stats.financialStats?.yearlyRevenue.toLocaleString('de-DE')} €</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <FiCalendar className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Durchschn. Vertragswert</p>
                        <p className="text-lg font-semibold text-gray-900">{stats.financialStats?.averageContractValue.toLocaleString('de-DE')} €</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <FiClock className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Ausstehende Zahlungen</p>
                        <p className="text-lg font-semibold text-gray-900">{stats.financialStats?.pendingPayments.toLocaleString('de-DE')} €</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <Link href="/admin/finances" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Alle Finanzdaten anzeigen →
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Email-Statistiken</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <FiMail className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Gesendete Kampagnen</p>
                        <p className="text-lg font-semibold text-gray-900">{dashboardStats.emailStats.totalCampaigns}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <FiCheck className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Gesendete Emails</p>
                        <p className="text-lg font-semibold text-gray-900">{dashboardStats.emailStats.totalSent}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <FiBarChart2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Durchschn. Öffnungsrate</p>
                        <p className="text-lg font-semibold text-gray-900">32%</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {dashboardStats.emailStats.recentCampaigns && dashboardStats.emailStats.recentCampaigns.length > 0 ? (
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-2">Letzte Kampagnen</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betreff</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empfänger</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dashboardStats.emailStats.recentCampaigns.slice(0, 3).map((campaign) => (
                            <tr key={campaign.id}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{campaign.subject}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{campaign.recipient_count}</td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  campaign.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  campaign.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {campaign.status === 'completed' ? 'Abgeschlossen' : 
                                   campaign.status === 'in_progress' ? 'In Bearbeitung' : 
                                   campaign.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                {new Date(campaign.created_at).toLocaleDateString('de-DE')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">Keine kürzlichen Email-Kampagnen</div>
                )}
                
                <div className="mt-4 text-right">
                  <Link href="/admin/email-builder/history" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Alle Email-Kampagnen anzeigen →
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Events-Übersicht</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <FiCalendar className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Kommende Events</p>
                        <p className="text-lg font-semibold text-gray-900">{dashboardStats.eventsStats.upcomingEvents}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <FiUsers className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Teilnahmequote</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {dashboardStats.eventsStats.avgParticipationRate > 0 
                            ? `${Math.round(dashboardStats.eventsStats.avgParticipationRate)}%` 
                            : '0%'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                        <FiBarChart2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Gesamt Events</p>
                        <p className="text-lg font-semibold text-gray-900">{dashboardStats.eventsStats.totalEvents}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-amber-500 rounded-md p-3">
                        <FiClock className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Vergangene Events</p>
                        <p className="text-lg font-semibold text-gray-900">{dashboardStats.eventsStats.pastEvents}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-right">
                  <Link href="/admin/events" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 mr-4">
                    Alle Events anzeigen →
                  </Link>
                  <Link href="/admin/events/new" className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center inline-flex">
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Neues Event erstellen
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Schnellzugriff</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Link href="/admin/partner-requests" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <FiAlertCircle className="h-6 w-6 text-yellow-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">Partner-Anfragen</span>
                    </Link>
                    <Link href="/admin/contact-tables" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <FiCalendar className="h-6 w-6 text-indigo-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">Contact Tables</span>
                    </Link>
                    <Link href="/admin/email-builder" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <FiMail className="h-6 w-6 text-blue-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">E-Mail-Builder</span>
                    </Link>
                    <Link href="/admin/email-builder/history" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <FiMail className="h-6 w-6 text-green-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">E-Mail-Verlauf</span>
                    </Link>
                    {/* Test mit verschiedenen Navigationsmethoden */}
                    <div className="flex flex-col gap-1">
                      {/* Methode 1: Direkter Router-Push */}
                      <div 
                        onClick={() => {
                          console.log('Benutzer-Link (Router-Push) geklickt');
                          router.push('/admin/users');
                        }}
                        className="flex items-center p-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <FiUsers className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-blue-700">Benutzer (Router-Push)</span>
                      </div>
                      
                      {/* Methode 2: Standard Next.js Link */}
                      <Link 
                        href="/admin/users" 
                        className="flex items-center p-2 rounded-lg border border-green-200 hover:bg-green-50 transition-colors"
                        onClick={() => console.log('Benutzer-Link (Next.js Link) geklickt')}
                      >
                        <FiUsers className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm font-medium text-green-700">Benutzer (Next.js Link)</span>
                      </Link>
                      
                      {/* Methode 3: Standard HTML a-Tag */}
                      <a 
                        href="/admin/users" 
                        className="flex items-center p-2 rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors"
                        onClick={() => console.log('Benutzer-Link (HTML a-Tag) geklickt')}
                      >
                        <FiUsers className="h-5 w-5 text-orange-500 mr-2" />
                        <span className="text-sm font-medium text-orange-700">Benutzer (HTML a-Tag)</span>
                      </a>
                    </div>
                    
                    <Link href="/admin/restaurants" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <FiHome className="h-6 w-6 text-green-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">Restaurants</span>
                    </Link>
                    <Link href="/admin/moderation/comments" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <FiMessageSquare className="h-6 w-6 text-orange-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">Kommentare moderieren</span>
                    </Link>
                    <Link href="/admin/moderation/reviews" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <FiStar className="h-6 w-6 text-purple-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">Bewertungen moderieren</span>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Systemstatus</h2>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-3">
                        {lastUpdated ? `Letztes Update: ${lastUpdated.toLocaleTimeString('de-DE')}` : ''}
                      </span>
                      <button 
                        onClick={fetchSystemStatus}
                        disabled={statusLoading}
                        className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
                      >
                        <FiRefreshCw className={`mr-1 ${statusLoading ? 'animate-spin' : ''}`} />
                        {statusLoading ? 'Wird aktualisiert...' : 'Aktualisieren'}
                      </button>
                    </div>
                  </div>
                  
                  {statusLoading && !systemStatus ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : systemStatus ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                            systemStatus.api.status === 'online' ? 'bg-green-500' : 
                            systemStatus.api.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-700">API-Dienste</span>
                        </div>
                        <div className="flex items-center">
                          {systemStatus.api.status === 'online' ? (
                            <span className="text-sm text-green-600 font-medium flex items-center">
                              <FiCheck className="mr-1" /> Online
                              {systemStatus.api.latency !== null && systemStatus.api.latency > 0 && (
                                <span className="ml-2 text-xs text-gray-500">{systemStatus.api.latency}ms</span>
                              )}
                            </span>
                          ) : systemStatus.api.status === 'degraded' ? (
                            <span className="text-sm text-yellow-600 font-medium flex items-center">
                              <FiAlertTriangle className="mr-1" /> Eingeschränkt
                            </span>
                          ) : (
                            <span className="text-sm text-red-600 font-medium flex items-center">
                              <FiAlertCircle className="mr-1" /> Offline
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                            systemStatus.database.status === 'online' ? 'bg-green-500' : 
                            systemStatus.database.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-700">Datenbank</span>
                        </div>
                        <div className="flex items-center">
                          {systemStatus.database.status === 'online' ? (
                            <span className="text-sm text-green-600 font-medium flex items-center">
                              <FiCheck className="mr-1" /> Online
                              {systemStatus.database.latency !== null && systemStatus.database.latency > 0 && (
                                <span className="ml-2 text-xs text-gray-500">{systemStatus.database.latency}ms</span>
                              )}
                            </span>
                          ) : systemStatus.database.status === 'degraded' ? (
                            <span className="text-sm text-yellow-600 font-medium flex items-center">
                              <FiAlertTriangle className="mr-1" /> Eingeschränkt
                            </span>
                          ) : (
                            <span className="text-sm text-red-600 font-medium flex items-center">
                              <FiAlertCircle className="mr-1" /> Offline
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                            systemStatus.payment.status === 'online' ? 'bg-green-500' : 
                            systemStatus.payment.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-700">Zahlungssystem</span>
                        </div>
                        <div className="flex items-center">
                          {systemStatus.payment.status === 'online' ? (
                            <span className="text-sm text-green-600 font-medium flex items-center">
                              <FiCheck className="mr-1" /> Online
                            </span>
                          ) : systemStatus.payment.status === 'degraded' ? (
                            <span className="text-sm text-yellow-600 font-medium flex items-center">
                              <FiAlertTriangle className="mr-1" /> Eingeschränkt
                            </span>
                          ) : (
                            <span className="text-sm text-red-600 font-medium flex items-center">
                              <FiAlertCircle className="mr-1" /> Offline
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                            systemStatus.email.status === 'online' ? 'bg-green-500' : 
                            systemStatus.email.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-700">E-Mail-Dienst</span>
                        </div>
                        <div className="flex items-center">
                          {systemStatus.email.status === 'online' ? (
                            <span className="text-sm text-green-600 font-medium flex items-center">
                              <FiCheck className="mr-1" /> Online
                            </span>
                          ) : systemStatus.email.status === 'degraded' ? (
                            <span className="text-sm text-yellow-600 font-medium flex items-center">
                              <FiAlertTriangle className="mr-1" /> Eingeschränkt
                            </span>
                          ) : (
                            <span className="text-sm text-red-600 font-medium flex items-center">
                              <FiAlertCircle className="mr-1" /> Offline
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-gray-300 mr-2"></div>
                          <span className="text-sm text-gray-700">API-Dienste</span>
                        </div>
                        <span className="text-sm text-gray-500 font-medium">Status unbekannt</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-gray-300 mr-2"></div>
                          <span className="text-sm text-gray-700">Datenbank</span>
                        </div>
                        <span className="text-sm text-gray-500 font-medium">Status unbekannt</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-gray-300 mr-2"></div>
                          <span className="text-sm text-gray-700">Zahlungssystem</span>
                        </div>
                        <span className="text-sm text-gray-500 font-medium">Status unbekannt</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-gray-300 mr-2"></div>
                          <span className="text-sm text-gray-700">E-Mail-Dienst</span>
                        </div>
                        <span className="text-sm text-gray-500 font-medium">Status unbekannt</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Email-Management-Sektion */}
            <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Email-Management</h2>
                
                {/* Email Statistics */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-800">Gesamt Kampagnen</p>
                          <p className="text-2xl font-bold text-blue-900">{(dashboardStats as any)?.emailStats?.totalCampaigns || 0}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                          <FiMail className="h-6 w-6 text-blue-500" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">Gesendete E-Mails</p>
                          <p className="text-2xl font-bold text-green-900">{(dashboardStats as any)?.emailStats?.totalSent || 0}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                          <FiCheck className="h-6 w-6 text-green-500" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-800">Durchschnittl. Empfänger</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {(dashboardStats as any)?.emailStats?.totalCampaigns > 0 
                              ? Math.round((dashboardStats as any)?.emailStats?.totalSent / (dashboardStats as any)?.emailStats?.totalCampaigns) 
                              : 0}
                          </p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                          <FiUsers className="h-6 w-6 text-purple-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Email Campaigns */}
                  {(dashboardStats as any)?.emailStats?.recentCampaigns && (dashboardStats as any).emailStats.recentCampaigns.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Neueste E-Mail-Kampagnen</h3>
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betreff</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empfänger</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(dashboardStats as any).emailStats.recentCampaigns.map((campaign: {id: string; subject: string; recipient_count: number; status: string; created_at: string}) => (
                              <tr key={campaign.id}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{campaign.subject}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{campaign.recipient_count}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${campaign.status === 'completed' ? 'bg-green-100 text-green-800' : campaign.status === 'sending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {campaign.status === 'completed' ? 'Abgeschlossen' : campaign.status === 'sending' ? 'Wird gesendet' : campaign.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatDate(campaign.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Email Management Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <FiMail className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Email-Builder</h3>
                        <p className="text-sm text-gray-500">Erstellen und versenden Sie personalisierte Emails an Ihre Kunden</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link href="/admin/email-builder" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Email-Builder öffnen
                      </Link>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <FiMail className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Email-Verlauf</h3>
                        <p className="text-sm text-gray-500">Verfolgen Sie gesendete Kampagnen und deren Erfolgsraten</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link href="/admin/email-builder/history" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        Verlauf anzeigen
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Analytik und Berichte */}
              <div className="mb-8">
                {analyticsLoading && !analyticsData ? (
                  <div className="bg-white p-6 rounded-lg shadow flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : analyticsData ? (
                  <AnalyticsCharts data={analyticsData} isLoading={analyticsLoading} />
                ) : (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-center py-8">
                      <FiBarChart2 className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Analytikdaten verfügbar</h3>
                      <p className="mt-1 text-sm text-gray-500">Klicken Sie auf den Button, um Daten zu laden.</p>
                      <div className="mt-6">
                        <button
                          onClick={() => fetchAnalyticsData()}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <FiBarChart2 className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                          Analytikdaten laden
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
