import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../../components/PageLayout';
import { userApi } from '../../utils/api';
import { FiBell, FiCalendar, FiMessageSquare, FiUser, FiInfo, FiCheck, FiAlertCircle } from 'react-icons/fi';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        setLoading(true);
        
        // Echten API-Aufruf verwenden
        const { data, error } = await userApi.getNotifications({});
        
        if (error) {
          console.error('Fehler beim Laden der Benachrichtigungen:', error);
          setError('Benachrichtigungen konnten nicht geladen werden.');
        } else if (data && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        } else {
          // Fallback zu Demo-Daten, wenn keine Benachrichtigungen vorhanden sind oder das Format nicht stimmt
          console.log('Keine Benachrichtigungen gefunden oder falsches Datenformat, verwende Demo-Daten');
          const demoNotifications = [
            {
              id: 1,
              type: 'event_invitation',
              title: 'Neue Event-Einladung',
              message: 'Sie wurden zu einem gemeinsamen Abendessen im Restaurant Bella Italia eingeladen.',
              date: '2025-05-30T10:30:00',
              read: false,
              actionUrl: '/events/1'
            },
            {
              id: 2,
              type: 'event_reminder',
              title: 'Event-Erinnerung',
              message: 'Ihr Event "Mittagessen mit neuen Kontakten" findet morgen um 12:30 Uhr statt.',
              date: '2025-05-29T15:45:00',
              read: true,
              actionUrl: '/events/2'
            },
            {
              id: 3,
              type: 'new_message',
              title: 'Neue Nachricht',
              message: 'Sie haben eine neue Nachricht von Maria Schmidt erhalten.',
              date: '2025-05-28T09:15:00',
              read: false,
              actionUrl: '/messages/3'
            },
            {
              id: 4,
              type: 'system',
              title: 'Willkommen bei Contact Tables',
              message: 'Vielen Dank für Ihre Registrierung! Entdecken Sie Restaurants und knüpfen Sie neue Kontakte.',
              date: '2025-05-27T14:00:00',
              read: true,
              actionUrl: null
            }
          ];
          
          setNotifications(demoNotifications);
        }
      } catch (err) {
        console.error('Unerwarteter Fehler beim Laden der Benachrichtigungen:', err);
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Heute, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Gestern, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  const markAsRead = async (id: number) => {
    try {
      // Echten API-Aufruf verwenden
      const { error } = await userApi.markNotificationAsRead(id.toString());
      
      if (error) {
        console.error('Fehler beim Markieren der Benachrichtigung als gelesen:', error);
      } else {
        setNotifications(notifications.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        ));
      }
    } catch (err) {
      console.error('Unerwarteter Fehler:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Echten API-Aufruf verwenden
      if (!user) return;
      const { error } = await userApi.markAllNotificationsAsRead();
      
      if (error) {
        console.error('Fehler beim Markieren aller Benachrichtigungen als gelesen:', error);
      } else {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      }
    } catch (err) {
      console.error('Unerwarteter Fehler:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_invitation':
      case 'event_reminder':
        return <FiCalendar className="text-blue-500" />;
      case 'new_message':
        return <FiMessageSquare className="text-green-500" />;
      case 'system':
        return <FiInfo className="text-purple-500" />;
      default:
        return <FiBell className="text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Benachrichtigungen">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <div className="text-center py-8">
            <FiAlertCircle className="mx-auto text-4xl text-red-500 mb-4" />
            <h3 className="text-xl font-medium mb-2">Fehler</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Benachrichtigungen">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FiBell className="text-primary mr-2 text-xl" />
            {unreadCount > 0 && (
              <span className="ml-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount} neu
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-primary hover:text-primary-dark flex items-center"
            >
              <FiCheck className="mr-1" /> Alle als gelesen markieren
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`py-4 ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex">
                  <div className="flex-shrink-0 pt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-4 flex-grow">
                    <div className="flex justify-between">
                      <h3 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.date)}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <div className="mt-2 flex justify-between">
                      {notification.actionUrl && (
                        <button
                          onClick={() => router.push(notification.actionUrl)}
                          className="text-sm text-primary hover:text-primary-dark"
                        >
                          Details anzeigen
                        </button>
                      )}
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Als gelesen markieren
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiBell className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-xl font-medium mb-2">Keine Benachrichtigungen</h3>
            <p className="text-gray-500 mb-6">Sie haben keine neuen Benachrichtigungen.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
