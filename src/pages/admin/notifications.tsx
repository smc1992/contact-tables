import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FiBell, FiCheck, FiAlertCircle, FiMessageSquare, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/client';
import AdminSidebar from '../../components/AdminSidebar';
import { AdminNotification } from '@/components/admin/NotificationCenter';

export default function AdminNotifications() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const supabase = createClient();

  // Benachrichtigungen laden
  const fetchNotifications = async (pageNum = 1) => {
    setRefreshing(true);
    try {
      const offset = (pageNum - 1) * limit;
      const response = await fetch(`/api/admin/notifications?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Benachrichtigungen');
      }
      
      const data = await response.json();
      setNotifications(data.notifications);
      setTotalCount(data.count || data.notifications.length);
      setPage(pageNum);
    } catch (error) {
      console.error('Fehler beim Laden der Benachrichtigungen:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Benachrichtigung als gelesen markieren
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Markieren als gelesen');
      }

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Fehler beim Markieren als gelesen:', error);
    }
  };

  // Alle Benachrichtigungen als gelesen markieren
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Markieren aller als gelesen');
      }

      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Fehler beim Markieren aller als gelesen:', error);
    }
  };

  // Echtzeit-Abonnement für neue Benachrichtigungen
  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push('/auth/login');
      } else if (user && user.user_metadata?.role !== 'ADMIN') {
        router.push('/');
      } else {
        fetchNotifications();

        const subscription = supabase
          .channel('admin_notifications_channel')
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, 
            (payload) => {
              const newNotification = payload.new as AdminNotification;
              setNotifications(prev => [newNotification, ...prev]);
              setTotalCount(prev => prev + 1);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
        };
      }
    }
  }, [authLoading, session, router, user]);

  // Icon basierend auf Benachrichtigungstyp
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <FiAlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <FiAlertCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <FiCheck className="h-5 w-5 text-green-500" />;
      case 'info':
      default:
        return <FiMessageSquare className="h-5 w-5 text-blue-500" />;
    }
  };

  // Zeitstempel formatieren
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <h2 className="mt-4 text-lg font-medium text-gray-900">Wird geladen...</h2>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-col md:flex-row flex-grow">
        <AdminSidebar activeItem="notifications" />
        
        <main className="flex-grow bg-gray-50 py-6 px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Benachrichtigungen</h1>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => fetchNotifications(page)}
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
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Alle Benachrichtigungen</h2>
                {notifications.some(n => !n.read) && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Alle als gelesen markieren
                  </button>
                )}
              </div>
              
              {notifications.length > 0 ? (
                <div className="border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {notifications.map((notification) => (
                      <li
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="ml-3 w-0 flex-1">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-xs text-gray-500">
                                {formatTimestamp(notification.created_at)}
                              </p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                            {notification.action_url && (
                              <a
                                href={notification.action_url}
                                className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-800"
                              >
                                {notification.action_text || 'Details anzeigen'}
                              </a>
                            )}
                          </div>
                          {!notification.read && (
                            <div className="ml-4 flex-shrink-0 flex">
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                              >
                                <span className="sr-only">Als gelesen markieren</span>
                                <FiCheck className="h-5 w-5" aria-hidden="true" />
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiBell className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Benachrichtigungen</h3>
                  <p className="mt-1 text-sm text-gray-500">Es sind derzeit keine Benachrichtigungen vorhanden.</p>
                </div>
              )}
              
              {/* Paginierung */}
              {totalCount > limit && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => fetchNotifications(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Zurück
                    </button>
                    <button
                      onClick={() => fetchNotifications(page + 1)}
                      disabled={page * limit >= totalCount}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${page * limit >= totalCount ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Weiter
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Zeige <span className="font-medium">{(page - 1) * limit + 1}</span> bis{' '}
                        <span className="font-medium">{Math.min(page * limit, totalCount)}</span> von{' '}
                        <span className="font-medium">{totalCount}</span> Ergebnissen
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => fetchNotifications(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="sr-only">Zurück</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {/* Seitenzahlen */}
                        {Array.from({ length: Math.ceil(totalCount / limit) }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => fetchNotifications(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === i + 1
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => fetchNotifications(page + 1)}
                          disabled={page * limit >= totalCount}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${page * limit >= totalCount ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            </div>
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
