import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { createClient as createServerClient } from '../../../utils/supabase/server';
import { createClient as createBrowserClient } from '../../../utils/supabase/client';
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
  isVisible: boolean;
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
  const [restaurantState, setRestaurantState] = useState<RestaurantData>(restaurant);
  const supabase = createBrowserClient();

  useEffect(() => {
    if (!restaurantState?.id) return;
    // Nur abonnieren, wenn noch nicht aktiv/sichtbar
    const needsActivation = !restaurantState?.isVisible || restaurantState?.contractStatus !== 'ACTIVE';
    if (!needsActivation) return;

    const channel = supabase
      .channel('restaurants-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'restaurants',
        filter: `id=eq.${restaurantState.id}`,
      }, (payload) => {
        const next = (payload as any)?.new || {};
        if (next && next.id === restaurantState.id) {
          setRestaurantState((prev) => ({ ...prev, ...next }));
        }
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [restaurantState?.id]);
  
  const resolveUrl = (base?: string) => {
    if (!base) return undefined;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}custom=${encodeURIComponent(restaurantState.id)}`;
  };
  const monthlyBase = process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_MONTHLY_URL || process.env.NEXT_PUBLIC_DIGISTORE_PLAN_MONTHLY_URL || process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_BASIC_URL || process.env.NEXT_PUBLIC_DIGISTORE_PLAN_BASIC_URL || process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_URL || '#';
  const yearlyBase = process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_YEARLY_URL || process.env.NEXT_PUBLIC_DIGISTORE_PLAN_YEARLY_URL || process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_PREMIUM_URL || process.env.NEXT_PUBLIC_DIGISTORE_PLAN_PREMIUM_URL || process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_URL || '#';
  const monthlyUrl = resolveUrl(monthlyBase);
  const yearlyUrl = resolveUrl(yearlyBase);
  
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
                  Verwalten Sie Ihr Restaurant und Ihre Contact-tables
                </p>
              </div>
            </div>
            
            {/* Zahlungs-/Aktivierungs-Hinweis */}
            {(!restaurantState?.isVisible || restaurantState?.contractStatus !== 'ACTIVE') && (
              <div className="mb-8">
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-6">
                  <h2 className="text-lg font-semibold text-yellow-800 mb-2">Profil noch nicht freigeschaltet</h2>
                  <p className="text-yellow-900 mb-4">
                    Bitte schließen Sie die Bestellung über Digistore24 ab. Ihre Bestellung wird manuell geprüft; erst nach Freischaltung wird Ihre Zahlungsmethode belastet und Ihr Restaurantprofil sichtbar.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {monthlyUrl && (
                      <a
                        href={monthlyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium transition-colors"
                      >
                        Monatlich zahlen
                      </a>
                    )}
                    {yearlyUrl && (
                      <a
                        href={yearlyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-yellow-600 text-yellow-800 hover:bg-yellow-100 rounded-md font-medium transition-colors"
                      >
                        Jährlich zahlen
                      </a>
                    )}
                    <a
                      href="/restaurant/dashboard/subscription"
                      className="inline-flex items-center px-4 py-2 border border-yellow-600 text-yellow-800 hover:bg-yellow-100 rounded-md font-medium transition-colors"
                    >
                      Abonnement verwalten
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {/* Willkommensbereich */}
            <div className="bg-primary-500 rounded-lg shadow-md p-8 mb-8 text-white">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Willkommen zurück, {restaurantState?.name || 'Restaurant'}!
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
  const supabase = createServerClient(context);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      redirect: {
        destination: '/auth/login?redirect=/restaurant/dashboard',
        permanent: false,
      },
    };
  }
  
  const userRole = user.user_metadata?.role;
  if (userRole !== 'RESTAURANT') {
    return {
      redirect: {
        destination: '/', 
        permanent: false,
      },
    };
  }
  
  try {
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('userId', user.id)
      .single();

    if (restaurantError || !restaurantData) {
      return {
        redirect: {
          destination: '/restaurant/register?error=not_found',
          permanent: false,
        },
      };
    }

    const restaurant: RestaurantData = {
      id: restaurantData.id,
      name: restaurantData.name,
      description: restaurantData.description || '',
      address: restaurantData.address || '',
      city: restaurantData.city || '',
      cuisine: restaurantData.cuisine || '',
      phone: restaurantData.phone || '',
      email: restaurantData.email || '',
      website: restaurantData.website || '',
      capacity: Number(restaurantData.capacity || 0),
      openingHours: (restaurantData.opening_hours as string) || '',
      imageUrl: restaurantData.image_url || null,
      isVisible: Boolean(restaurantData.is_visible),
      contractStatus: restaurantData.contract_status || 'PENDING',
      createdAt: restaurantData.created_at,
      updatedAt: restaurantData.updated_at,
      userId: restaurantData.userId,
    };

    return {
      props: {
        restaurant,
      },
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Restaurantdaten (Supabase):', error);
    return {
      props: {
        error: 'Fehler beim Abrufen der Restaurantdaten',
      },
    };
  }
};
