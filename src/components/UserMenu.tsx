import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLogOut, FiHeart, FiCalendar, FiSettings, FiBell, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const UserMenu = () => {
  const { session, user, loading, userRole } = useAuth(); // userRole aus AuthContext holen
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Entferne lokalen userRole State und useEffect, da wir userRole aus dem AuthContext verwenden

  const isLoading = loading;

  // Logge die Rolle aus dem AuthContext
  useEffect(() => {
    console.log('UserMenu - userRole from AuthContext:', userRole);
    console.log('UserMenu - user object:', user);
  }, [userRole, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const { signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="relative">
        <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
      </div>
    );
  }

  // Wenn kein Benutzer angemeldet ist, wird die Komponente nicht gerendert.
  if (!session || !user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full py-1 pl-1 pr-3 transition-colors"
      >
        {user?.user_metadata?.avatar_url ? (
          <Image src={user.user_metadata.avatar_url} alt={user.user_metadata?.name || 'User avatar'} width={32} height={32} />
        ) : (
          <FiUser className="text-primary-500" size={18} />
        )}
        <span className="text-sm font-medium text-gray-700"> 
          {user.user_metadata?.name ? user.user_metadata.name.split(' ')[0] : 'Mein Konto'}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200"
          >
            {user ? (
              <>
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user.user_metadata?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {userRole && <p className="text-xs font-medium text-indigo-500 mt-1">{userRole === 'RESTAURANT' ? 'Restaurant-Konto' : 'Kunden-Konto'}</p>}
                </div>
                
                {/* Menüpunkte für Kunden */}
                {(userRole === 'CUSTOMER' || userRole === 'USER') && (
                  <>
                    <Link href="/customer/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FiUser className="mr-3 text-gray-500" size={16} />
                      Mein Profil
                    </Link>
                    
                    <Link href="/customer/favorites" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FiHeart className="mr-3 text-gray-500" size={16} />
                      Favoriten
                    </Link>
                    
                    <Link href="/customer/events" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FiCalendar className="mr-3 text-gray-500" size={16} />
                      Meine Events
                    </Link>
                    
                    <Link href="/customer/notifications" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FiBell className="mr-3 text-gray-500" size={16} />
                      Benachrichtigungen
                    </Link>
                    
                    <Link href="/customer/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FiSettings className="mr-3 text-gray-500" size={16} />
                      Einstellungen
                    </Link>
                  </>
                )}
                
                {/* Menüpunkte für Restaurants */}
                {userRole === 'RESTAURANT' && (
                  <>
                    <Link href="/restaurant/dashboard" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FiMapPin className="mr-3 text-gray-500" size={16} />
                      Restaurant-Dashboard
                    </Link>
                    
                    <Link href="/restaurant/dashboard/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FiUser className="mr-3 text-gray-500" size={16} />
                      Restaurant-Profil
                    </Link>
                    
                    <Link href="/restaurant/dashboard/contact-tables" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FiCalendar className="mr-3 text-gray-500" size={16} />
                      Kontakttische verwalten
                    </Link>
                  </>
                )}
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <FiLogOut className="mr-3 text-red-500" size={16} />
                  Abmelden
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <FiUser className="mr-3 text-gray-500" size={16} />
                  Anmelden
                </Link>
                
                <Link href="/auth/register" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <FiUser className="mr-3 text-gray-500" size={16} />
                  Registrieren
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
