import { GetServerSideProps } from 'next';
import { createClient } from '../../../utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import { FiEdit, FiImage, FiCalendar, FiBarChart2 } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import RestaurantSidebar from '../../../components/restaurant/RestaurantSidebar';

interface RestaurantData {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  cuisine: string;
  phone: string;
  email: string;
  website: string;
  capacity: number;
  openingHours: string;
  imageUrl: string | null;
  isActive: boolean;
  contractStatus: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  contract?: {
    id: string;
    planId: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  _count?: {
    events: number;
  };
}

interface DashboardProps {
  restaurant: RestaurantData;
}

export default function SimpleDashboard({ restaurant }: DashboardProps) {
  // Vereinfachte Version ohne Animationen und komplexe Berechnungen
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex flex-col md:flex-row">
        <RestaurantSidebar activeItem="dashboard" />
        
        <main className="flex-1 px-4 md:px-8 pb-12 mt-16">
          <div className="max-w-5xl mx-auto">
            {/* Dashboard Header mit Navigation */}
            <div className="bg-white shadow-lg rounded-lg mb-6 overflow-hidden border border-gray-200">
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800">Restaurant Dashboard</h1>
                <p className="text-gray-600 mt-2">
                  Verwalten Sie Ihr Restaurant und Ihre Contact Tables
                </p>
              </div>
            </div>
            
            {/* Willkommensbereich */}
            <div className="bg-primary-500 rounded-lg shadow-md p-8 mb-8 text-white">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Willkommen zurück, {restaurant?.name || 'Restaurant'}!
              </h1>
              <p className="text-white opacity-90 max-w-2xl mb-4">
                Hier können Sie Ihr Restaurantprofil verwalten, Kontakttische erstellen und Ihre Statistiken einsehen.
              </p>
              <a 
                href="/restaurant/dashboard/contact-tables/new" 
                className="inline-flex items-center px-4 py-2 bg-white text-primary-600 rounded-md font-medium hover:bg-primary-50 transition-colors shadow-sm"
              >
                Neuen Kontakttisch erstellen
              </a>
            </div>
            
            {/* Schnellzugriff */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Schnellzugriff</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Profil bearbeiten */}
                <a href="/restaurant/dashboard/profile" className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="bg-primary-100 p-3 rounded-full mr-4">
                      <FiEdit className="text-primary-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Profil bearbeiten</h3>
                      <p className="text-sm text-gray-500">Aktualisieren Sie Ihre Restaurantdaten</p>
                    </div>
                  </div>
                </a>
                
                {/* Neuer Kontakttisch */}
                <a href="/restaurant/dashboard/contact-tables/new" className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="bg-primary-100 p-3 rounded-full mr-4">
                      <FiCalendar className="text-primary-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Neuer Kontakttisch</h3>
                      <p className="text-sm text-gray-500">Erstellen Sie einen neuen Tisch</p>
                    </div>
                  </div>
                </a>
                
                {/* Bilder verwalten */}
                <a href="/restaurant/dashboard/images" className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="bg-primary-100 p-3 rounded-full mr-4">
                      <FiImage className="text-primary-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Bilder verwalten</h3>
                      <p className="text-sm text-gray-500">Laden Sie neue Bilder hoch</p>
                    </div>
                  </div>
                </a>
                
                {/* Statistiken */}
                <a href="/restaurant/dashboard/statistics" className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="bg-primary-100 p-3 rounded-full mr-4">
                      <FiBarChart2 className="text-primary-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Statistiken</h3>
                      <p className="text-sm text-gray-500">Sehen Sie Ihre Leistungsdaten</p>
                    </div>
                  </div>
                </a>
              </div>
            </div>
            
            {/* Hinweis */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Dies ist eine vereinfachte Version des Dashboards, um Leistungsprobleme zu vermeiden. 
                    <a href="/restaurant/dashboard" className="font-medium underline ml-1">
                      Zum vollständigen Dashboard
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Erstelle einen Supabase-Client mit den Cookies des Requests
  const supabase = createClient(context);
  
  // Überprüfe, ob der Benutzer angemeldet ist
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  
  // Überprüfe, ob der Benutzer die Rolle "RESTAURANT" hat
  const userRole = session.user.user_metadata?.role;
  
  if (userRole !== 'RESTAURANT') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  // Hole die Restaurantdaten aus der Datenbank
  const prisma = new PrismaClient();
  
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        contract: true,
        _count: {
          select: {
            events: true,
          },
        },
      },
    });
    
    if (!restaurant) {
      return {
        redirect: {
          destination: '/restaurant/register',
          permanent: false,
        },
      };
    }
    
    return {
      props: {
        restaurant: JSON.parse(JSON.stringify(restaurant)),
      },
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Restaurantdaten:', error);
    
    return {
      props: {
        error: 'Fehler beim Abrufen der Restaurantdaten',
      },
    };
  } finally {
    await prisma.$disconnect();
  }
};
