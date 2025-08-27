import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCheck, FiAlertCircle, FiMessageSquare, FiUser, FiCalendar } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/client';

export interface AdminNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  action_url?: string;
  action_text?: string;
}

interface NotificationCenterProps {
  onNotificationClick?: (notification: AdminNotification) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const supabase = createClient();

  // Benachrichtigungen laden
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Fehler beim Laden der Benachrichtigungen:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (error) {
      console.error('Fehler beim Laden der Benachrichtigungen:', error);
    } finally {
      setLoading(false);
    }
  };

  // Benachrichtigung als gelesen markieren
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        console.error('Fehler beim Markieren als gelesen:', error);
        return;
      }

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Fehler beim Markieren als gelesen:', error);
    }
  };

  // Alle Benachrichtigungen als gelesen markieren
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return;
      
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) {
        console.error('Fehler beim Markieren aller als gelesen:', error);
        return;
      }

      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Fehler beim Markieren aller als gelesen:', error);
    }
  };

  // Echtzeit-Abonnement für neue Benachrichtigungen
  useEffect(() => {
    fetchNotifications();

    const subscription = supabase
      .channel('admin_notifications_channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, 
        (payload) => {
          const newNotification = payload.new as AdminNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `Vor ${diffMins} Minute${diffMins !== 1 ? 'n' : ''}`;
    } else if (diffHours < 24) {
      return `Vor ${diffHours} Stunde${diffHours !== 1 ? 'n' : ''}`;
    } else if (diffDays < 7) {
      return `Vor ${diffDays} Tag${diffDays !== 1 ? 'en' : ''}`;
    } else {
      return date.toLocaleDateString('de-DE');
    }
  };

  return (
    <div className="relative">
      {/* Benachrichtigungsglocke mit Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-indigo-600 focus:outline-none"
        aria-label="Benachrichtigungen"
      >
        <FiBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Benachrichtigungsdropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50"
          >
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">Benachrichtigungen</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Alle als gelesen markieren
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : notifications.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                        if (onNotificationClick) {
                          onNotificationClick(notification);
                        }
                      }}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="ml-3 w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                          {notification.action_url && (
                            <a
                              href={notification.action_url}
                              className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {notification.action_text || 'Details anzeigen'}
                            </a>
                          )}
                          <p className="mt-1 text-xs text-gray-400">
                            {formatTimestamp(notification.created_at)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="ml-4 flex-shrink-0 flex">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                              <span className="sr-only">Schließen</span>
                              <FiX className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  Keine Benachrichtigungen vorhanden
                </div>
              )}
            </div>

            <div className="p-2 bg-gray-50 border-t border-gray-200">
              <a
                href="/admin/notifications"
                className="block w-full text-center text-xs font-medium text-indigo-600 hover:text-indigo-800"
                onClick={() => setIsOpen(false)}
              >
                Alle Benachrichtigungen anzeigen
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
