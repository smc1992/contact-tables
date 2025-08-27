import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiPackage, FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';

interface Amenity {
  id: string;
  name: string;
  icon: string;
  description?: string;
  restaurant_count: number;
  created_at: string;
}

export default function AmenitiesPage() {
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAmenity, setCurrentAmenity] = useState<Amenity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    description: ''
  });
  const supabase = createClient();

  // Laden der Ausstattungsdaten
  const fetchAmenities = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('amenities')
        .select(`
          id,
          name,
          icon,
          description,
          created_at
        `)
        .order('name');

      if (error) throw error;

      // Anzahl der Restaurants pro Ausstattungsmerkmal abrufen
      const amenitiesWithCount = await Promise.all(
        (data || []).map(async (amenity) => {
          const { count, error: countError } = await supabase
            .from('restaurant_amenities')
            .select('restaurant_id', { count: 'exact', head: true })
            .eq('amenity_id', amenity.id);

          return {
            ...amenity,
            restaurant_count: count || 0
          };
        })
      );

      setAmenities(amenitiesWithCount);
    } catch (error) {
      console.error('Fehler beim Laden der Ausstattungsmerkmale:', error);
      // Fallback zu Dummy-Daten bei Fehler
      setAmenities([
        {
          id: '1',
          name: 'WLAN',
          icon: 'wifi',
          description: 'Kostenloses WLAN für Gäste',
          restaurant_count: 25,
          created_at: '2025-01-15T12:00:00Z'
        },
        {
          id: '2',
          name: 'Barrierefreiheit',
          icon: 'wheelchair',
          description: 'Barrierefreier Zugang und Einrichtungen',
          restaurant_count: 18,
          created_at: '2025-01-20T14:30:00Z'
        },
        {
          id: '3',
          name: 'Außenbereich',
          icon: 'sun',
          description: 'Terrasse oder Garten',
          restaurant_count: 22,
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
        
        fetchAmenities();
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Ausstattungsmerkmal bearbeiten
  const handleEditAmenity = (amenity: Amenity) => {
    setCurrentAmenity(amenity);
    setFormData({
      name: amenity.name,
      icon: amenity.icon,
      description: amenity.description || ''
    });
    setIsModalOpen(true);
  };

  // Neues Ausstattungsmerkmal erstellen
  const handleAddAmenity = () => {
    setCurrentAmenity(null);
    setFormData({
      name: '',
      icon: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  // Ausstattungsmerkmal speichern
  const handleSaveAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentAmenity) {
        // Ausstattungsmerkmal aktualisieren
        const { error } = await supabase
          .from('amenities')
          .update({
            name: formData.name,
            icon: formData.icon,
            description: formData.description
          })
          .eq('id', currentAmenity.id);
          
        if (error) throw error;
      } else {
        // Neues Ausstattungsmerkmal erstellen
        const { error } = await supabase
          .from('amenities')
          .insert({
            name: formData.name,
            icon: formData.icon,
            description: formData.description
          });
          
        if (error) throw error;
      }
      
      // Modal schließen und Daten neu laden
      setIsModalOpen(false);
      fetchAmenities();
    } catch (error) {
      console.error('Fehler beim Speichern des Ausstattungsmerkmals:', error);
      alert('Fehler beim Speichern des Ausstattungsmerkmals');
    }
  };

  // Ausstattungsmerkmal löschen
  const handleDeleteAmenity = async (id: string) => {
    if (!confirm('Möchten Sie dieses Ausstattungsmerkmal wirklich löschen?')) return;
    
    try {
      const { error } = await supabase
        .from('amenities')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Daten neu laden
      fetchAmenities();
    } catch (error) {
      console.error('Fehler beim Löschen des Ausstattungsmerkmals:', error);
      alert('Fehler beim Löschen des Ausstattungsmerkmals');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="amenities" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Ausstattungsmerkmale</h1>
              <div className="flex space-x-3">
                <button
                  onClick={fetchAmenities}
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
                  onClick={handleAddAmenity}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <FiPlus className="mr-2" />
                  Neues Merkmal
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
                        Icon
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beschreibung
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
                        <td colSpan={6} className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                        </td>
                      </tr>
                    ) : amenities.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          Keine Ausstattungsmerkmale gefunden
                        </td>
                      </tr>
                    ) : (
                      amenities.map((amenity) => (
                        <tr key={amenity.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{amenity.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-gray-400">
                                <FiPackage />
                              </span>
                              <span className="ml-2 text-sm text-gray-500">{amenity.icon}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 truncate max-w-xs">
                              {amenity.description || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{amenity.restaurant_count}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(amenity.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditAmenity(amenity)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <FiEdit2 className="inline" /> Bearbeiten
                            </button>
                            <button
                              onClick={() => handleDeleteAmenity(amenity.id)}
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

      {/* Modal für Ausstattungsmerkmal hinzufügen/bearbeiten */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {currentAmenity ? 'Ausstattungsmerkmal bearbeiten' : 'Neues Ausstattungsmerkmal'}
            </h2>
            <form onSubmit={handleSaveAmenity}>
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
                <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (CSS-Klasse)
                </label>
                <input
                  type="text"
                  id="icon"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
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
