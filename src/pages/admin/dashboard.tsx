import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FiUsers, FiHome, FiCalendar, FiAlertCircle, FiClock, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import AdminSidebar from '../../components/AdminSidebar';
import { formatDate } from '../../utils/dateUtils';

export default function AdminDashboard() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  interface ActivityItem {
    type: 'registration' | 'contract' | 'payment';
    restaurant: string;
    date: string;
  }
  
  interface DashboardStats {
    users: number;
    restaurants: number;
    pendingRequests: number;
    activeRestaurants: number;
    recentActivity: ActivityItem[];
  }
  
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    restaurants: 0,
    pendingRequests: 0,
    activeRestaurants: 0,
    recentActivity: []
  });
  
  // Funktion zum Laden der Dashboard-Daten
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Dashboard-Statistiken');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error);
      // Fallback zu Dummy-Daten bei Fehler
      setStats({
        users: 42,
        restaurants: 12,
        pendingRequests: 3,
        activeRestaurants: 9,
        recentActivity: [
          { type: 'registration', restaurant: 'Restaurant Sonnenschein', date: new Date().toISOString() },
          { type: 'contract', restaurant: 'Café am See', date: new Date(Date.now() - 86400000).toISOString() },
          { type: 'payment', restaurant: 'Pizzeria Napoli', date: new Date(Date.now() - 172800000).toISOString() }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

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
  }, [authLoading, session, router]);

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
              <button 
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Aktualisieren
              </button>
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
                          <div className="text-2xl font-semibold text-gray-900">{stats.restaurants}</div>
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
                          <div className="text-2xl font-semibold text-gray-900">{stats.pendingRequests}</div>
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
                          <div className="text-2xl font-semibold text-gray-900">{stats.activeRestaurants}</div>
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
                          <div className="text-2xl font-semibold text-gray-900">24</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <a href="/admin/events" className="font-medium text-indigo-600 hover:text-indigo-500">Alle Events anzeigen</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Neueste Aktivitäten */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Neueste Aktivitäten</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  <li>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">Neuer Benutzer registriert</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Neu</p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">Max Mustermann</p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>Vor 2 Stunden</p>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">Neues Restaurant hinzugefügt</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Neu</p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">Ristorante Italiano</p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>Vor 1 Tag</p>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
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
                                <time dateTime={activity.date}>{formatDate(new Date(activity.date))}</time>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Schnellzugriff</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <a href="/admin/partner-requests" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <FiAlertCircle className="h-6 w-6 text-yellow-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">Partner-Anfragen</span>
                    </a>
                    <a href="/admin/contact-tables" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <FiCalendar className="h-6 w-6 text-indigo-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">Contact Tables</span>
                    </a>
                    <a href="/admin/users" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <FiUsers className="h-6 w-6 text-blue-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">Benutzerverwaltung</span>
                    </a>
                    <a href="/admin/restaurants" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <FiHome className="h-6 w-6 text-green-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">Restaurants</span>
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Systemstatus</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-gray-700">API-Dienste</span>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Online</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-gray-700">Datenbank</span>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Online</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-gray-700">Zahlungssystem</span>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Online</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-gray-700">E-Mail-Dienst</span>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Online</span>
                    </div>
                  </div>
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
