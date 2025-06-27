import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiHome, FiUsers, FiMapPin, FiSettings, FiList, FiPackage, 
         FiMail, FiFileText, FiGrid, FiTag, FiMenu, FiX, FiCheckSquare } from 'react-icons/fi';

interface AdminSidebarProps {
  activeItem?: string;
}

export default function AdminSidebar({ activeItem = 'dashboard' }: AdminSidebarProps) {
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', id: 'dashboard', path: '/admin' },
    { icon: FiCheckSquare, label: 'Partneranfragen', id: 'partner-requests', path: '/admin/partner-requests' },
    { icon: FiList, label: 'Restaurants', id: 'restaurants', path: '/admin/restaurants' },
    { icon: FiPackage, label: 'Abonnements', id: 'subscriptions', path: '/admin/subscriptions' },
    { icon: FiGrid, label: 'Kategorien', id: 'categories', path: '/admin/categories' },
    { icon: FiTag, label: 'Ausstattung', id: 'amenities', path: '/admin/amenities' },
    { icon: FiMapPin, label: 'Städte', id: 'cities', path: '/admin/cities' },
    { icon: FiUsers, label: 'Benutzer', id: 'users', path: '/admin/users' },
    { icon: FiFileText, label: 'Blogs', id: 'blogs', path: '/admin/blogs' },
    { icon: FiMail, label: 'Newsletter', id: 'newsletter', path: '/admin/newsletter' },
    { icon: FiSettings, label: 'Einstellungen', id: 'settings', path: '/admin/settings' },
  ];

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <div className="fixed bottom-4 right-4 md:hidden z-30">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="bg-primary-600 text-white p-3 rounded-full shadow-lg"
        >
          {isMobileSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isMobileSidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: isMobileSidebarOpen ? 'auto' : 'none' }}
      >
        <motion.div
          className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-30 overflow-y-auto"
          initial={{ x: '-100%' }}
          animate={{ x: isMobileSidebarOpen ? 0 : '-100%' }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Admin</h2>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;
                
                return (
                  <li key={item.id}>
                    <Link
                      href={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setIsMobileSidebarOpen(false)}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                      {item.id === 'partner-requests' && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          Neu
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </motion.div>
      </motion.div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-white shadow-md min-h-screen pt-20">
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                <li key={item.id}>
                  <Link
                    href={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                    {item.id === 'partner-requests' && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Neu
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
