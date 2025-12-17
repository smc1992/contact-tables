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
    { name: 'Dashboard', href: '/customer/dashboard', icon: FiHome },
    { name: 'Meine Events', href: '/customer/events', icon: FiCalendar },
    { name: 'Favoriten', href: '/customer/favorites', icon: FiHeart },
    { name: 'Benachrichtigungen', href: '/customer/notifications', icon: FiBell },
    { name: 'Profil', href: '/customer/profile', icon: FiUser },
    { name: 'Einstellungen', href: '/customer/settings', icon: FiSettings },
  ];

  return (
    <aside className="w-64 bg-white shadow-xl rounded-lg h-full flex flex-col">
      <nav className="space-y-2 flex-grow p-4">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href || 
                          (activePage === item.name.toLowerCase());
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center py-3 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out ${
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
  );
}
