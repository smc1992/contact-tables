import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiUser, FiHome, FiMapPin, FiInfo, FiLogIn, FiUserPlus, FiUsers, FiSettings, FiList, FiCoffee } from 'react-icons/fi';
import UserMenu from './UserMenu';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // userRole direkt aus useAuth() beziehen
  const { session, user, loading, userRole } = useAuth();
  
  useEffect(() => {
    console.log('Header - Auth Status:', { 
      isLoggedIn: !!session, 
      user: user?.email,
      userRole: userRole, // userRole kommt jetzt aus dem AuthContext
      userFullObject: user // Um das gesamte User-Objekt zu sehen, falls nötig
    });
  }, [session, user, userRole]);
  
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className="fixed w-full top-0 z-50 transition-all duration-300 bg-white shadow-md py-3">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="h-10 flex items-center bg-white/90 px-3 py-1 rounded-lg">
              <img 
                src="/images/logo-fixed/Logo CT quer 4c.webp" 
                alt="Contact Tables Logo" 
                className="h-8 md:h-10 transition-all group-hover:scale-105"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center rounded-full py-2 px-4 bg-primary-300 shadow-sm">
              <Link href="/restaurants" className="flex items-center space-x-1 transition-colors px-4 py-2 text-black font-medium hover:text-gray-600">
                <FiMapPin size={18} />
                <span>Restaurants</span>
              </Link>
              <Link href="/contact-tables" className="flex items-center space-x-1 transition-colors px-4 py-2 text-black font-medium hover:text-gray-600">
                <FiUsers size={18} />
                <span>Kontakttische</span>
              </Link>
              
              {/* Admin-spezifische Links */}
              {userRole === 'ADMIN' && (
                <Link href="/admin/contact-tables" className="flex items-center space-x-1 transition-colors px-4 py-2 text-black font-medium hover:text-gray-600">
                  <FiSettings size={18} />
                  <span>Admin</span>
                </Link>
              )}
              
              {/* Restaurant-spezifische Links */}
              {userRole === 'RESTAURANT' && (
                <Link href="/restaurant/contact-tables" className="flex items-center space-x-1 transition-colors px-4 py-2 text-black font-medium hover:text-gray-600">
                  <FiList size={18} />
                  <span>Mein Restaurant</span>
                </Link>
              )}
              
              {/* Kunden-spezifische Links */}
              {(userRole === 'CUSTOMER' || userRole === 'USER') && (
                <Link href="/customer/dashboard" className="flex items-center space-x-1 transition-colors px-4 py-2 text-black font-medium hover:text-gray-600">
                  <FiUser size={18} />
                  <span>Mein Dashboard</span>
                </Link>
              )}
              
              <Link href="/about" className="flex items-center space-x-1 transition-colors px-4 py-2 text-black font-medium hover:text-gray-600">
                <FiInfo size={18} />
                <span>Über uns</span>
              </Link>
              <Link href="/faq" className="flex items-center space-x-1 transition-colors px-4 py-2 text-black font-medium hover:text-gray-600">
                <FiInfo size={18} />
                <span>FAQ</span>
              </Link>
            </div>
            
            {/* Auth Buttons und User Menu */}
            <div className="flex items-center space-x-4">
              {/* UserMenu Komponente */}
              <UserMenu />
              
              <div className="h-6 w-px bg-neutral-300"></div>
              
              {/* Login Button - Einziger Button für alle Benutzertypen */}
              {!user && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/auth/login" className="bg-white hover:bg-neutral-100 text-secondary-700 font-bold py-2 px-4 rounded-full flex items-center space-x-1 transition-all border-2 border-primary-500 shadow-sm">
                    <FiLogIn size={18} />
                    <span>Login</span>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-full text-secondary-700 hover:bg-neutral-100 transition-all border border-neutral-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden py-4 space-y-4 overflow-hidden bg-white shadow-lg rounded-b-xl"
            >
              <Link href="/restaurants" className="flex items-center space-x-2 px-4 py-3 text-secondary-500 hover:bg-neutral-50 hover:text-primary-500 transition-colors">
                <FiMapPin size={18} />
                <span>Restaurants</span>
              </Link>
              <Link href="/contact-tables" className="flex items-center space-x-2 px-4 py-3 text-secondary-500 hover:bg-neutral-50 hover:text-primary-500 transition-colors">
                <FiUsers size={18} />
                <span>Kontakttische</span>
              </Link>
              
              {/* Admin-spezifische Links (Mobil) */}
              {userRole === 'ADMIN' && (
                <Link href="/admin/contact-tables" className="flex items-center space-x-2 px-4 py-3 text-secondary-500 hover:bg-neutral-50 hover:text-primary-500 transition-colors">
                  <FiSettings size={18} />
                  <span>Admin</span>
                </Link>
              )}
              
              {/* Restaurant-spezifische Links (Mobil) */}
              {userRole === 'RESTAURANT' && (
                <Link href="/restaurant/contact-tables" className="flex items-center space-x-2 px-4 py-3 text-secondary-500 hover:bg-neutral-50 hover:text-primary-500 transition-colors">
                  <FiList size={18} />
                  <span>Mein Restaurant</span>
                </Link>
              )}
              
              {/* Kunden-spezifische Links (Mobil) */}
              {(userRole === 'CUSTOMER' || userRole === 'USER') && (
                <Link href="/customer/dashboard" className="flex items-center space-x-2 px-4 py-3 text-secondary-500 hover:bg-neutral-50 hover:text-primary-500 transition-colors">
                  <FiUser size={18} />
                  <span>Mein Dashboard</span>
                </Link>
              )}
              
              <Link href="/about" className="flex items-center space-x-2 px-4 py-3 text-secondary-500 hover:bg-neutral-50 hover:text-primary-500 transition-colors">
                <FiInfo size={18} />
                <span>Über uns</span>
              </Link>
              <Link href="/faq" className="flex items-center space-x-2 px-4 py-3 text-secondary-500 hover:bg-neutral-50 hover:text-primary-500 transition-colors">
                <FiInfo size={18} />
                <span>FAQ</span>
              </Link>
              <div className="pt-4 border-t border-neutral-100 space-y-2 px-4">
                {loading ? (
                  <div className="animate-pulse h-8 w-20 bg-gray-300 rounded"></div>
                ) : user ? (
                  <UserMenu />
                ) : (
                  <>
                    <Link href="/auth/login" className="flex items-center space-x-2 py-3 px-4 bg-primary-500 text-white font-bold rounded-lg hover:bg-primary-600 transition-colors">
                      <FiLogIn size={18} />
                      <span>Login</span>
                    </Link>
                    <Link href="/auth/register" className="flex items-center space-x-2 py-3 px-4 mt-2 border border-primary-500 text-secondary-500 rounded-lg hover:bg-neutral-50 transition-colors">
                      <FiUserPlus size={18} />
                      <span>Registrieren</span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
} 