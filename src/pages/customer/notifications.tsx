import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import CustomerSidebar from '../../components/customer/CustomerSidebar';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FiBell, FiCalendar, FiMessageSquare, FiUser, FiTrash2, FiSettings, FiCheck } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/supabase';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string; // Entspricht 'message' in der Benutzeroberfläche
  created_at: string | null;
  is_read: boolean; // Entspricht 'read' in der Benutzeroberfläche
  link: string | null; // Entspricht 'action_url' in der Benutzeroberfläche
}

export default function CustomerNotifications() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  

  // Lade Benachrichtigungen
  const loadNotifications = async () => {
    if (!session || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Prüfe zuerst, ob die Tabelle existiert
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('count()')
        .limit(1);
      
      if (tableCheckError) {
        console.warn('Benachrichtigungen-Tabelle möglicherweise nicht verfügbar:', tableCheckError);
        // Setze leere Benachrichtigungen, aber keinen Fehler - die Funktion ist einfach noch nicht implementiert
        setNotifications([]);
        setLoading(false);
        return;
      }
      
      // Benachrichtigungen aus der Datenbank laden
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Fehler beim Abrufen der Benachrichtigungen:', fetchError);
        setError('Die Benachrichtigungen konnten nicht geladen werden. Bitte versuche es später erneut.');
        setLoading(false);
        return;
      }
      
      setNotifications(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Unerwarteter Fehler beim Laden der Benachrichtigungen:', error);
      setError('Die Benachrichtigungen konnten nicht geladen werden. Bitte versuche es später erneut.');
      setLoading(false);
    }
  };

  // Benachrichtigung als gelesen markieren
  const markAsRead = async (id: string) => {
    if (!user) return;
    
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Lokalen Zustand aktualisieren
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      ));
    } catch (error) {
      console.error('Fehler beim Markieren als gelesen:', error);
      setError('Die Benachrichtigung konnte nicht als gelesen markiert werden. Bitte versuche es später erneut.');
    }
  };

  // Benachrichtigung löschen
  const deleteNotification = async (id: string) => {
    if (!user) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Lokalen Zustand aktualisieren
      setNotifications(notifications.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Fehler beim Löschen der Benachrichtigung:', error);
      setError('Die Benachrichtigung konnte nicht gelöscht werden. Bitte versuche es später erneut.');
    }
  };

  // Alle Benachrichtigungen als gelesen markieren
  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (updateError) {
        throw updateError;
      }
      
      // Lokalen Zustand aktualisieren
      setNotifications(notifications.map(notification => ({ ...notification, is_read: true })));
    } catch (error) {
      console.error('Fehler beim Markieren aller Benachrichtigungen als gelesen:', error);
      setError('Die Benachrichtigungen konnten nicht als gelesen markiert werden. Bitte versuche es später erneut.');
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
        
        // Gültige Rolle, Benachrichtigungen laden
        loadNotifications();
      } catch (error) {
        console.error('Fehler bei der Rollenprüfung:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [session, user, authLoading, router]);

  // Icon basierend auf dem Benachrichtigungstyp
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EVENT_INVITE':
      case 'EVENT_UPDATE':
      case 'EVENT_REMINDER':
        return <FiCalendar className="h-6 w-6 text-indigo-500" />;
      case 'MESSAGE':
        return <FiMessageSquare className="h-6 w-6 text-green-500" />;
      case 'SYSTEM':
        return <FiSettings className="h-6 w-6 text-gray-500" />;
      default:
        return <FiBell className="h-6 w-6 text-blue-500" />;
    }
  };

  // Formatiere Datum
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Heute, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Gestern, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `Vor ${diffDays} Tagen`;
    } else {
      return date.toLocaleDateString('de-DE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex">
        <CustomerSidebar activePage="notifications" />
        <main className="flex-grow bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Container for the actual page content - white background, shadow */}
            <div className="bg-white shadow-lg rounded-lg p-6 md:p-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-3xl font-bold text-gray-900">Benachrichtigungen</h1>
                  
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={markAllAsRead}
                    >
                      <FiCheck className="mr-2" />
                      Alle als gelesen markieren
                    </button>
                  )}
                </div>
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}
                
                {loading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-lg">Laden...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-10">
                    <FiBell className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Keine Benachrichtigungen</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Sie haben derzeit keine neuen Benachrichtigungen.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg shadow-sm border ${notification.is_read ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200'}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {notification.created_at ? formatDate(notification.created_at) : ''}
                              </p>
                            </div>
                            <p className={`mt-1 text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-800'}`}>
                              {notification.content}
                            </p>
                            <div className="mt-2 flex items-center space-x-3">
                              {!notification.is_read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                  Als gelesen markieren
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-xs font-medium text-red-600 hover:text-red-500"
                              >
                                Löschen
                              </button>
                              {notification.link && (
                                <a 
                                  href={notification.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs font-medium text-blue-600 hover:text-blue-500"
                                >
                                  Details anzeigen
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div> {/* End white content container */}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
