import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiHome, FiCalendar, FiHeart, FiBell, FiUser, FiSettings } from 'react-icons/fi';

interface CustomerSidebarProps {
  activePage?: string;
}

export default function CustomerSidebar({ activePage = 'dashboard' }: CustomerSidebarProps) {
  const router = useRouter();
  
  // Navigation-Items für den Kundenbereich
  const navItems = [
    { name: 'Dashboard', shortName: 'Home', href: '/customer/dashboard', icon: FiHome },
    { name: 'Meine Events', shortName: 'Events', href: '/customer/events', icon: FiCalendar },
    { name: 'Favoriten', shortName: 'Favoriten', href: '/customer/favorites', icon: FiHeart },
    { name: 'Benachrichtigungen', shortName: 'Infos', href: '/customer/notifications', icon: FiBell },
    { name: 'Profil', shortName: 'Profil', href: '/customer/profile', icon: FiUser },
    { name: 'Einstellungen', shortName: 'Setup', href: '/customer/settings', icon: FiSettings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white shadow-xl rounded-lg h-full flex-col">
        <nav className="space-y-2 flex-grow p-4">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href || 
                            (activePage === item.name.toLowerCase()) || 
                            (activePage === 'notifications' && item.href.includes('notifications')); // Fix für Notifications active state
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center py-3 px-4 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out ${
                  isActive
                    ? 'bg-yellow-400 text-black shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon 
                  className={`mr-4 h-5 w-5 ${
                    isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-500'
                  }`} 
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-6 border-t border-gray-200 p-4">
          <div className="bg-primary-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-primary-800">Brauchst du Hilfe?</h3>
            <p className="mt-1 text-xs text-secondary-500">
              Wenn du Fragen hast, schau in unsere FAQ oder kontaktiere uns.
            </p>
            <Link
              href="/faq"
              className="mt-3 block w-full text-center text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              FAQ ansehen
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 pb-safe">
        <div className="flex justify-between items-center h-16 px-2 overflow-x-auto no-scrollbar">
          {navItems.map((item) => { // Zeige alle Items
            const isActive = router.pathname === item.href || 
                            (activePage === item.name.toLowerCase()) ||
                            (activePage === 'notifications' && item.href.includes('notifications'));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center min-w-[60px] h-full space-y-1 ${
                  isActive ? 'text-yellow-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-yellow-600' : 'text-gray-500'}`} />
                <span className="text-[10px] font-medium truncate w-full text-center px-0.5 leading-tight">
                  {item.shortName}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Spacer für Mobile Bottom Nav */}
      <div className="md:hidden h-16" />
    </>
  );
}
