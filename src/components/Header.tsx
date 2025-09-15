import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiMapPin, FiInfo, FiLogIn, FiUserPlus, FiUsers, FiCoffee, FiHelpCircle } from 'react-icons/fi';

import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isRestaurantOwner = user?.user_metadata?.role === 'RESTAURANT';

  const navItems = [
    { href: '/restaurants', label: 'Restaurants', icon: FiMapPin },
    { href: '/contact-tables', label: 'contact-tables', icon: FiUsers },
    ...(isRestaurantOwner ? [{ href: '/restaurant/dashboard', label: 'Mein Restaurant', icon: FiCoffee }] : []),
    { href: '/about', label: 'Über uns', icon: FiInfo },
    { href: '/faq', label: 'Häufige Fragen', icon: FiHelpCircle },
  ];

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-white'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <img className="h-16 w-auto" src="/images/logo-fixed/Logo CT mittig 4c.webp" alt="Contact Tables" />
            </Link>
          </div>

          <nav className="hidden md:flex md:items-center md:space-x-2 lg:space-x-4">
            <div className="bg-primary-50/50 rounded-full p-1 flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-3 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-primary-100 hover:text-primary-600 transition-colors flex items-center space-x-2"
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="flex items-center">
            <div className="hidden md:block">
              {user ? (
                <UserMenu />
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/login" className="bg-white hover:bg-neutral-100 text-secondary-700 font-bold py-2 px-4 rounded-full flex items-center space-x-1 transition-all border-2 border-primary-500 shadow-sm">
                    <FiLogIn size={18} />
                    <span>Login</span>
                  </Link>
                  <Link href="/auth/register" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-full flex items-center space-x-1 transition-all shadow-sm">
                    <FiUserPlus size={18} />
                    <span>Registrieren</span>
                  </Link>
                </div>
              )}
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span className="sr-only">Menü öffnen</span>
                {isMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden bg-white"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={mobileMenuVariants}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100"
                >
                   {item.icon && <item.icon className="h-6 w-6 mr-3" />}
                  <span>{item.label}</span>
                </Link>
              ))}
              <div className="border-t border-gray-200 my-2"></div>
              {user ? (
                 <div className="p-2">
                    <UserMenu />
                 </div>
              ) : (
                <>
                  <Link href="/auth/login" className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100">
                    <FiLogIn className="h-6 w-6 mr-3" />
                    <span>Login</span>
                  </Link>
                  <Link href="/auth/register" className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100">
                    <FiUserPlus className="h-6 w-6 mr-3" />
                    <span>Registrieren</span>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
