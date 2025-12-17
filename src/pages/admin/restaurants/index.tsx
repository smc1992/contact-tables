import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiList, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiEye, FiMapPin, FiCheckCircle } from 'react-icons/fi';
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
  is_visible?: boolean;
  contract_status?: 'PENDING' | 'ACTIVE' | 'CANCELLED' | string;
  is_featured: boolean;
  owner_id: string;
  owner_name?: string;
  created_at: string;
  updated_at: string;
  rating: number;
  review_count: number;
  image_url?: string;
  last_verified_at?: string | null;
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
        const rating = typeof restaurant.rating === 'number' && !isNaN(restaurant.rating)
          ? restaurant.rating
          : 0;
        const review_count = typeof restaurant.review_count === 'number' && !isNaN(restaurant.review_count)
          ? restaurant.review_count
          : 0;
        return {
          ...restaurant,
          rating,
          review_count,
          description: restaurant.description || '',
          owner_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unbekannt'
        };
      });

      // Last verified: Latest payment_events per restaurant (verify_check or on_payment)
      const ids = formattedData.map((r: any) => r.id).filter(Boolean);
      let lastMap: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: events } = await supabase
          .from('payment_events')
          .select('restaurant_id, created_at, event_type')
          .in('restaurant_id', ids)
          .order('created_at', { ascending: false });
        (events || []).forEach((ev: any) => {
          const rid = ev?.restaurant_id;
          if (!rid) return;
          if (!lastMap[rid]) {
            lastMap[rid] = ev?.created_at;
          }
        });
      }

      setRestaurants(formattedData.map((r: any) => ({
        ...r,
        last_verified_at: lastMap[r.id] || null,
      })));
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

  // Restaurant ansehen (Admin-Detailseite)
  const handleViewRestaurant = (id: string) => {
    router.push(`/admin/restaurants/${id}`);
  };

  // Inline-Nachrichten für sichtbares Feedback
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Restaurant löschen (Admin-API ruft Prisma + Supabase-Spiegelung)
  const handleDeleteRestaurant = async (id: string) => {
    if (!confirm('Möchten Sie dieses Restaurant wirklich löschen?')) return;
    try {
      const resp = await fetch(`/api/admin/restaurants?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Cache-Control': 'no-cache' },
        credentials: 'same-origin',
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const msg = data?.error || data?.message || `HTTP ${resp.status}`;
        setMessage({ text: `Fehler beim Löschen: ${msg}`, type: 'error' });
        return;
      }
      // Erfolgreich gelöscht
      setMessage({ text: 'Restaurant wurde gelöscht.', type: 'success' });
      fetchRestaurants();
    } catch (error) {
      console.error('Fehler beim Löschen des Restaurants:', error);
      setMessage({ text: 'Unerwarteter Fehler beim Löschen', type: 'error' });
    }
  };

  // Zahlungsstatus prüfen und ggf. freischalten (Digistore Verify)
  const handleVerifyRestaurant = async (id: string) => {
    try {
      const resp = await fetch(`/api/digistore/verify?restaurantId=${encodeURIComponent(id)}&update=1`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        credentials: 'same-origin',
      });
      const data = await resp.json();
      if (!resp.ok) {
        const msg = data?.error || `HTTP ${resp.status}`;
        alert(`Fehler beim Status prüfen: ${msg}`);
        return;
      }
      if (data?.status?.isPaid) {
        alert('Zahlung bestätigt. Restaurant wurde freigeschaltet (falls noch nicht aktiv).');
        fetchRestaurants();
      } else {
        const msg = data?.status?.billingStatusMsg || data?.status?.billingStatus || 'kein Zahlungsnachweis';
        alert(`Kein Zahlungsnachweis gefunden: ${msg}`);
      }
    } catch (error) {
      console.error('Verify-Fehler:', error);
      alert('Unerwarteter Fehler beim Status prüfen');
    }
  };

  // Restaurant manuell aktivieren (Admin-Aktion)
  const handleActivateRestaurant = async (id: string) => {
    try {
      const resp = await fetch(`/api/admin/restaurants/activate?id=${encodeURIComponent(id)}` , {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'same-origin',
      });
      const data = await resp.json();
      if (!resp.ok) {
        const msg = data?.error || data?.message || `HTTP ${resp.status}`;
        alert(`Fehler beim Aktivieren: ${msg}`);
        return;
      }
      alert('Restaurant wurde aktiviert und freigeschaltet.');
      fetchRestaurants();
    } catch (error) {
      console.error('Fehler bei der Aktivierung:', error);
      alert('Unerwarteter Fehler bei der Aktivierung');
    }
  };

  // Status-Badge-Farbe bestimmen
  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getContractBadgeColor = (status?: string) => {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContractBadgeLabel = (status?: string) => {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':
        return 'Aktiv';
      case 'PENDING':
        return 'Ausstehend';
      case 'CANCELLED':
        return 'Gekündigt';
      default:
        return 'Unbekannt';
    }
  };

  // Kürzen des Textes
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="restaurants" />
        <main className="flex-1 p-6 bg-gray-50 overflow-x-hidden">
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

            {message && (
              <div
                className={`mb-4 px-4 py-3 rounded border ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : message.type === 'error'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{message.text}</span>
                  <button
                    onClick={() => setMessage(null)}
                    className="text-sm underline"
                    aria-label="Nachricht schließen"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div>
                <table className="w-full table-fixed divide-y divide-gray-200">
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
                        Zuletzt geprüft
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
                          <td className="px-6 py-4 break-words">
                            <div className="text-sm text-gray-900">{restaurant.owner_name}</div>
                          </td>
                        <td className="px-6 py-4 break-words">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(restaurant.is_active)}`}>
                            {restaurant.is_active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                          {typeof restaurant.contract_status !== 'undefined' && (
                            <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getContractBadgeColor(restaurant.contract_status)}`}>
                              Vertrag: {getContractBadgeLabel(restaurant.contract_status)}
                            </span>
                          )}
                          {typeof restaurant.is_visible !== 'undefined' && (
                            <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${restaurant.is_visible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {restaurant.is_visible ? 'Sichtbar' : 'Nicht sichtbar'}
                            </span>
                          )}
                          {restaurant.is_featured && (
                            <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              Featured
                            </span>
                          )}
                        </td>
                          <td className="px-6 py-4 break-words text-sm text-gray-700">
                          {restaurant.last_verified_at ? formatDate(restaurant.last_verified_at) : '—'}
                        </td>
                          <td className="px-6 py-4 break-words">
                            <div className="flex items-center">
                              {(() => {
                                const r = Number(restaurant.rating ?? 0);
                                const rounded = Math.max(0, Math.min(5, Math.round(isNaN(r) ? 0 : r)));
                                return (
                                  <>
                                    <span className="text-sm text-gray-900 mr-2">{(isNaN(r) ? 0 : r).toFixed(1)}</span>
                                    <div className="text-yellow-400">
                                      {'★'.repeat(rounded)}
                                      {'☆'.repeat(5 - rounded)}
                                    </div>
                                  </>
                                );
                              })()}
                              <span className="text-xs text-gray-500 ml-2">({Number(restaurant.review_count ?? 0)})</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(restaurant.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 break-words text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewRestaurant(restaurant.id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              title="Ansehen"
                            >
                              <FiEye />
                            </button>
                            {!restaurant.is_active ? (
                              <button
                                onClick={() => handleActivateRestaurant(restaurant.id)}
                                className="text-green-600 hover:text-green-900 mr-3"
                                title="Restaurant aktivieren"
                              >
                                <FiCheckCircle />
                              </button>
                            ) : (
                              restaurant.contract_status !== 'ACTIVE' && (
                                <button
                                  onClick={() => handleVerifyRestaurant(restaurant.id)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                  title="Zahlungsstatus prüfen"
                                >
                                  <FiRefreshCw />
                                </button>
                              )
                            )}
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
