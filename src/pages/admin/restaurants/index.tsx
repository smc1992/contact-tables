import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiList, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiEye, FiMapPin } from 'react-icons/fi';

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

export default function RestaurantsPage() {
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const supabase = createClient();

  // Laden der Restaurant-Daten
  const fetchRestaurants = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          profiles:owner_id (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(restaurant => {
        const profile = restaurant.profiles as unknown as { first_name: string | null; last_name: string | null };
        return {
          ...restaurant,
          owner_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unbekannt'
        };
      });

      setRestaurants(formattedData);
    } catch (error) {
      console.error('Fehler beim Laden der Restaurants:', error);
      // Fallback zu Dummy-Daten bei Fehler
      setRestaurants([
        {
          id: '1',
          name: 'Ristorante Italiano',
          description: 'Authentische italienische Küche im Herzen von Berlin.',
          address: 'Hauptstraße 42',
          city: 'Berlin',
          postal_code: '10115',
          phone: '+49123456789',
          email: 'info@ristoranteitaliano.de',
          website: 'https://ristoranteitaliano.de',
          is_active: true,
          is_featured: true,
          owner_id: '1',
          owner_name: 'Marco Rossi',
          created_at: '2025-06-15T10:30:00Z',
          updated_at: '2025-08-10T14:45:00Z',
          rating: 4.7,
          review_count: 128,
          image_url: '/images/restaurants/italian.jpg'
        },
        {
          id: '2',
          name: 'Sushi Palace',
          description: 'Frisches Sushi und japanische Spezialitäten.',
          address: 'Friedrichstraße 123',
          city: 'Berlin',
          postal_code: '10117',
          phone: '+49987654321',
          email: 'info@sushipalace.de',
          website: 'https://sushipalace.de',
          is_active: true,
          is_featured: false,
          owner_id: '2',
          owner_name: 'Yuki Tanaka',
          created_at: '2025-05-20T09:15:00Z',
          updated_at: '2025-08-05T11:30:00Z',
          rating: 4.5,
          review_count: 95,
          image_url: '/images/restaurants/sushi.jpg'
        },
        {
          id: '3',
          name: 'Burger House',
          description: 'Die besten Burger der Stadt mit hausgemachten Saucen.',
          address: 'Alexanderplatz 5',
          city: 'Berlin',
          postal_code: '10178',
          phone: '+49123123123',
          email: 'info@burgerhouse.de',
          website: 'https://burgerhouse.de',
          is_active: false,
          is_featured: false,
          owner_id: '3',
          owner_name: 'Max Müller',
          created_at: '2025-07-10T15:45:00Z',
          updated_at: '2025-07-10T15:45:00Z',
          rating: 4.2,
          review_count: 42,
          image_url: '/images/restaurants/burger.jpg'
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push('/auth/login');
      } else if (session && user) {
        if (user.user_metadata.role !== 'admin' && user.user_metadata.role !== 'ADMIN') {
          router.push('/');
          return;
        }
        
        fetchRestaurants();
      }
    }
  }, [authLoading, session, user, router]);

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
    if (!confirm('Möchten Sie dieses Restaurant wirklich löschen?')) return;
    
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
