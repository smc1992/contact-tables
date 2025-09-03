import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  handleError: (error: any, defaultMessage?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: NotificationType, message: string, duration = 5000) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Zentrale Fehlerbehandlungsfunktion
  const handleError = (error: any, defaultMessage = 'Ein Fehler ist aufgetreten') => {
    console.error(error);
    
    let errorMessage = defaultMessage;
    
    // Supabase-Fehler
    if (error?.message) {
      errorMessage = error.message;
    }
    
    // Fehler von fetch-Anfragen
    if (error?.error_description) {
      errorMessage = error.error_description;
    }
    
    // Fehler mit spezifischem Code
    if (error?.code) {
      switch (error.code) {
        case 'PGRST301':
          errorMessage = 'Keine Berechtigung für diese Aktion';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Ungültige E-Mail-Adresse';
          break;
        case '23505':
          errorMessage = 'Dieser Eintrag existiert bereits';
          break;
        case '23503':
          errorMessage = 'Der Eintrag kann nicht gelöscht werden, da er noch referenziert wird';
          break;
        default:
          // Wenn kein spezifischer Code erkannt wird, verwende die Standardnachricht
          break;
      }
    }
    
    addNotification('error', errorMessage);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        handleError
      }}
    >
      {children}
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
    </NotificationContext.Provider>
  );
};

interface NotificationContainerProps {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  removeNotification
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`p-4 rounded-lg shadow-lg flex items-start gap-3 ${
              notification.type === 'success'
                ? 'bg-green-50 border-l-4 border-green-500'
                : notification.type === 'error'
                ? 'bg-red-50 border-l-4 border-red-500'
                : notification.type === 'warning'
                ? 'bg-yellow-50 border-l-4 border-yellow-500'
                : 'bg-blue-50 border-l-4 border-blue-500'
            }`}
          >
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <FiCheckCircle className="text-green-500" size={20} />
              )}
              {notification.type === 'error' && (
                <FiAlertCircle className="text-red-500" size={20} />
              )}
              {notification.type === 'warning' && (
                <FiAlertCircle className="text-yellow-500" size={20} />
              )}
              {notification.type === 'info' && <FiInfo className="text-blue-500" size={20} />}
            </div>
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  notification.type === 'success'
                    ? 'text-green-800'
                    : notification.type === 'error'
                    ? 'text-red-800'
                    : notification.type === 'warning'
                    ? 'text-yellow-800'
                    : 'text-blue-800'
                }`}
              >
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX size={18} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
