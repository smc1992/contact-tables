import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiList, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiEye, FiMapPin } from 'react-icons/fi';
import { withAuth } from '@/utils/withAuth';
import dynamic from 'next/dynamic';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  website: string;
  is_active: boolean;
  is_featured: boolean;
  owner_id: string;
  owner_name?: string;
  created_at: string;
  updated_at: string;
  rating: number;
  review_count: number;
  image_url?: string;
}

interface RestaurantsPageProps {
  user: User;
}

// Dynamisch importieren, um Build-Fehler zu vermeiden
const RestaurantsPage = ({ user }: RestaurantsPageProps) => {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supabase, setSupabase] = useState<any>(null);

  // Laden der Restaurant-Daten
  const fetchRestaurants = async () => {
    if (!supabase) return;
    
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          profiles:userId (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase-Fehler beim Laden der Restaurants:', error);
        alert(`Fehler beim Laden der Restaurants: ${error.message}`);
        return;
      }

      const formattedData = (data || []).map((restaurant: any) => {
        const profile = restaurant.profiles as unknown as { first_name: string | null; last_name: string | null };
        return {
          ...restaurant,
          owner_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unbekannt'
        };
      });

      setRestaurants(formattedData);
    } catch (error) {
      console.error('Fehler beim Laden der Restaurants:', error);
      alert('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      // Leere Liste anzeigen statt Mockup-Daten
      setRestaurants([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Supabase-Client nur clientseitig initialisieren
    if (typeof window !== 'undefined') {
      const { createClient } = require('@/utils/supabase/client');
      setSupabase(createClient());
    }
  }, []);
  
  // Daten laden, wenn Supabase-Client verfügbar ist
  useEffect(() => {
    if (supabase) {
      fetchRestaurants();
    }
  }, [supabase]);

  // Formatierung des Datums
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Neues Restaurant erstellen
  const handleCreateRestaurant = () => {
    router.push('/admin/restaurants/create');
  };

  // Restaurant bearbeiten
  const handleEditRestaurant = (id: string) => {
    router.push(`/admin/restaurants/edit/${id}`);
  };

  // Restaurant ansehen
  const handleViewRestaurant = (id: string) => {
    router.push(`/restaurant/${id}`);
  };

  // Restaurant löschen
  const handleDeleteRestaurant = async (id: string) => {
    if (!supabase || !confirm('Möchten Sie dieses Restaurant wirklich löschen?')) return;
    
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Daten neu laden
      fetchRestaurants();
    } catch (error) {
      console.error('Fehler beim Löschen des Restaurants:', error);
      alert('Fehler beim Löschen des Restaurants');
    }
  };

  // Status-Badge-Farbe bestimmen
  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // Kürzen des Textes
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="restaurants" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
              <div className="flex space-x-3">
                <button
                  onClick={fetchRestaurants}
                  disabled={refreshing}
                  className={`px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {refreshing ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      Wird aktualisiert...
                    </>
                  ) : (
                    'Aktualisieren'
                  )}
                </button>
                <button
                  onClick={handleCreateRestaurant}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <FiPlus className="mr-2" />
                  Neues Restaurant
                </button>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restaurant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Standort
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inhaber
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bewertung
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Erstellt am
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                        </td>
                      </tr>
                    ) : restaurants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          Keine Restaurants gefunden
                        </td>
                      </tr>
                    ) : (
                      restaurants.map((restaurant) => (
                        <tr key={restaurant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {restaurant.image_url ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={restaurant.image_url}
                                    alt={restaurant.name}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <FiList className="text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                                <div className="text-sm text-gray-500">{truncateText(restaurant.description, 50)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <FiMapPin className="text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm text-gray-900">{restaurant.city}</div>
                                <div className="text-sm text-gray-500">{restaurant.address}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{restaurant.owner_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(restaurant.is_active)}`}>
                              {restaurant.is_active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                            {restaurant.is_featured && (
                              <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                Featured
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-900 mr-2">{restaurant.rating.toFixed(1)}</span>
                              <div className="text-yellow-400">
                                {'★'.repeat(Math.round(restaurant.rating))}
                                {'☆'.repeat(5 - Math.round(restaurant.rating))}
                              </div>
                              <span className="text-xs text-gray-500 ml-2">({restaurant.review_count})</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(restaurant.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewRestaurant(restaurant.id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              title="Ansehen"
                            >
                              <FiEye />
                            </button>
                            <button
                              onClick={() => handleEditRestaurant(restaurant.id)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                              title="Bearbeiten"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              onClick={() => handleDeleteRestaurant(restaurant.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Löschen"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

// Export der Komponente
export default RestaurantsPage;

// Standardisiertes withAuth HOC Muster für getServerSideProps
export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'],
  async (context, user) => {
    // Hier könnten zusätzliche Daten für die Admin-Restaurants-Seite geladen werden
    return {
      props: { user }
    };
  }
);

// Diese Seite erfordert JavaScript zur Laufzeit und kann nicht statisch exportiert werden
export const config = {
  unstable_runtimeJS: true,
  runtime: 'nodejs'
};
