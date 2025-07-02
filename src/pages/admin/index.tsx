import { useState } from 'react';
import { FiUsers, FiHome, FiSettings, FiList, FiPackage, FiMail, FiFileText, FiGrid, FiMapPin, FiTag, FiMenu } from 'react-icons/fi';
import { IconType } from 'react-icons';
import Header from '../../components/Header';
import { GetServerSideProps } from 'next';
import { createClient } from '../../utils/supabase/server';

interface DashboardCardProps {
  icon: IconType;
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', id: 'dashboard' },
    { icon: FiList, label: 'Verzeichniseinträge', id: 'listings' },
    { icon: FiPackage, label: 'Abonnements', id: 'subscriptions' },
    { icon: FiGrid, label: 'Kategorien', id: 'categories' },
    { icon: FiTag, label: 'Ausstattung', id: 'amenities' },
    { icon: FiMapPin, label: 'Städte', id: 'cities' },
    { icon: FiUsers, label: 'Benutzer', id: 'users' },
    { icon: FiFileText, label: 'Blogs', id: 'blogs' },
    { icon: FiMail, label: 'Newsletter', id: 'newsletter' },
    { icon: FiSettings, label: 'Einstellungen', id: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex h-[calc(100vh-64px)]">
        {/* Seitenleiste */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white h-full shadow-lg transition-all duration-300 ease-in-out`}>
          <div className="p-6 flex items-center justify-between">
            <h2 className={`text-xl font-semibold text-gray-800 ${!isSidebarOpen && 'hidden'}`}>Admin Panel</h2>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <FiMenu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <nav className="mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-6 py-3 text-sm ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {isSidebarOpen && item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Hauptinhalt */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Hier finden Sie eine Übersicht über {menuItems.find(item => item.id === activeTab)?.label || 'Ihr Dashboard'}
              </p>
            </div>
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-white text-gray-600 rounded-lg shadow hover:bg-gray-50">
                Exportieren
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">
                Neu erstellen
              </button>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <DashboardCard
                  icon={FiUsers}
                  label="Benutzer"
                  value="234"
                  change="+14%"
                  positive={true}
                />
                <DashboardCard
                  icon={FiHome}
                  label="Restaurants"
                  value="45"
                  change="+5%"
                  positive={true}
                />
                <DashboardCard
                  icon={FiList}
                  label="Events"
                  value="189"
                  change="-2%"
                  positive={false}
                />
                <DashboardCard
                  icon={FiPackage}
                  label="Aktive Abos"
                  value="67"
                  change="+23%"
                  positive={true}
                />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Neueste Aktivitäten</h2>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiUsers className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Neuer Benutzer registriert</p>
                          <p className="text-sm text-gray-500">vor 2 Stunden</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <FiSettings className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createClient(ctx);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  if (user.user_metadata?.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

function DashboardCard({ icon: Icon, label, value, change, positive }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-full bg-blue-50">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <span className={`text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
} 