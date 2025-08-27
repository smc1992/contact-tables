import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';

interface City {
  id: string;
  name: string;
  state: string;
  country: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  restaurant_count: number;
  created_at: string;
}

export default function CitiesPage() {
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    country: 'Deutschland',
    postal_code: '',
    latitude: 0,
    longitude: 0
  });
  const supabase = createClient();

  // Laden der Städtedaten
  const fetchCities = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('cities')
        .select(`
          id,
          name,
          state,
          country,
          postal_code,
          latitude,
          longitude,
          created_at
        `)
        .order('name');

      if (error) throw error;

      // Anzahl der Restaurants pro Stadt abrufen
      const citiesWithCount = await Promise.all(
        (data || []).map(async (city) => {
          const { count, error: countError } = await supabase
            .from('restaurants')
            .select('id', { count: 'exact', head: true })
            .eq('city_id', city.id);

          return {
            ...city,
            restaurant_count: count || 0
          };
        })
      );

      setCities(citiesWithCount);
    } catch (error) {
      console.error('Fehler beim Laden der Städte:', error);
      // Fallback zu Dummy-Daten bei Fehler
      setCities([
        {
          id: '1',
          name: 'Berlin',
          state: 'Berlin',
          country: 'Deutschland',
          postal_code: '10115',
          latitude: 52.52,
          longitude: 13.405,
          restaurant_count: 45,
          created_at: '2025-01-15T12:00:00Z'
        },
        {
          id: '2',
          name: 'München',
          state: 'Bayern',
          country: 'Deutschland',
          postal_code: '80331',
          latitude: 48.135,
          longitude: 11.582,
          restaurant_count: 32,
          created_at: '2025-01-20T14:30:00Z'
        },
        {
          id: '3',
          name: 'Hamburg',
          state: 'Hamburg',
          country: 'Deutschland',
          postal_code: '20095',
          latitude: 53.551,
          longitude: 9.993,
          restaurant_count: 28,
          created_at: '2025-01-25T09:15:00Z'
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
        
        fetchCities();
      }
    }
  }, [authLoading, session, user, router]);

  // Formatierung des Datums
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  // Formular-Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) || 0 : value 
    }));
  };

  // Stadt bearbeiten
  const handleEditCity = (city: City) => {
    setCurrentCity(city);
    setFormData({
      name: city.name,
      state: city.state,
      country: city.country,
      postal_code: city.postal_code,
      latitude: city.latitude,
      longitude: city.longitude
    });
    setIsModalOpen(true);
  };

  // Neue Stadt erstellen
  const handleAddCity = () => {
    setCurrentCity(null);
    setFormData({
      name: '',
      state: '',
      country: 'Deutschland',
      postal_code: '',
      latitude: 0,
      longitude: 0
    });
    setIsModalOpen(true);
  };

  // Stadt speichern
  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentCity) {
        // Stadt aktualisieren
        const { error } = await supabase
          .from('cities')
          .update({
            name: formData.name,
            state: formData.state,
            country: formData.country,
            postal_code: formData.postal_code,
            latitude: formData.latitude,
            longitude: formData.longitude
          })
          .eq('id', currentCity.id);
          
        if (error) throw error;
      } else {
        // Neue Stadt erstellen
        const { error } = await supabase
          .from('cities')
          .insert({
            name: formData.name,
            state: formData.state,
            country: formData.country,
            postal_code: formData.postal_code,
            latitude: formData.latitude,
            longitude: formData.longitude
          });
          
        if (error) throw error;
      }
      
      // Modal schließen und Daten neu laden
      setIsModalOpen(false);
      fetchCities();
    } catch (error) {
      console.error('Fehler beim Speichern der Stadt:', error);
      alert('Fehler beim Speichern der Stadt');
    }
  };

  // Stadt löschen
  const handleDeleteCity = async (id: string) => {
    if (!confirm('Möchten Sie diese Stadt wirklich löschen?')) return;
    
    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Daten neu laden
      fetchCities();
    } catch (error) {
      console.error('Fehler beim Löschen der Stadt:', error);
      alert('Fehler beim Löschen der Stadt');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="cities" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Städte</h1>
              <div className="flex space-x-3">
                <button
                  onClick={fetchCities}
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
                  onClick={handleAddCity}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <FiPlus className="mr-2" />
                  Neue Stadt
                </button>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bundesland
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Land
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PLZ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Koordinaten
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restaurants
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
                        <td colSpan={8} className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                        </td>
                      </tr>
                    ) : cities.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                          Keine Städte gefunden
                        </td>
                      </tr>
                    ) : (
                      cities.map((city) => (
                        <tr key={city.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-gray-400 mr-2">
                                <FiMapPin />
                              </span>
                              <div className="text-sm font-medium text-gray-900">{city.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{city.state}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{city.country}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{city.postal_code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{city.restaurant_count}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(city.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditCity(city)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <FiEdit2 className="inline" /> Bearbeiten
                            </button>
                            <button
                              onClick={() => handleDeleteCity(city.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FiTrash2 className="inline" /> Löschen
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

      {/* Modal für Stadt hinzufügen/bearbeiten */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {currentCity ? 'Stadt bearbeiten' : 'Neue Stadt'}
            </h2>
            <form onSubmit={handleSaveCity}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  Bundesland
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Land
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                  Postleitzahl
                </label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Breitengrad
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Längengrad
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
