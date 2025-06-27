import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
// Framer Motion entfernt, um history.replaceState()-Fehler zu beheben
import { 
  FiHome, FiEdit, FiImage, FiCalendar, FiUsers, 
  FiFileText, FiSettings, FiMenu, FiX, FiCreditCard 
} from 'react-icons/fi';

interface RestaurantSidebarProps {
  activeItem?: string;
}

export default function RestaurantSidebar({ activeItem = 'dashboard' }: RestaurantSidebarProps) {
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', id: 'dashboard', path: '/restaurant/dashboard/simple' },
    { icon: FiEdit, label: 'Profil bearbeiten', id: 'profile', path: '/restaurant/dashboard/profile' },
    { icon: FiImage, label: 'Bilder verwalten', id: 'images', path: '/restaurant/dashboard/images' },
    { icon: FiCalendar, label: 'Contact Tables', id: 'tables', path: '/restaurant/dashboard/tables' },
    { icon: FiUsers, label: 'Reservierungen', id: 'reservations', path: '/restaurant/dashboard/reservations' },
    { icon: FiCreditCard, label: 'Abonnement', id: 'subscription', path: '/restaurant/dashboard/subscription' },
    { icon: FiFileText, label: 'Vertrag & Dokumente', id: 'documents', path: '/restaurant/dashboard/documents' },
    { icon: FiSettings, label: 'Einstellungen', id: 'settings', path: '/restaurant/dashboard/settings' },
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
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          style={{ pointerEvents: 'auto' }}
        >
        <div
          className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-30 overflow-y-auto"
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Restaurant</h2>
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
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        </div>
      )}

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
