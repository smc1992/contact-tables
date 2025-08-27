import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import CustomerSidebar from '../../components/customer/CustomerSidebar';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FiHeart, FiMapPin, FiPhone, FiClock, FiTrash2, FiCalendar, FiUsers } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/supabase';

type ContactTable = Database['public']['Tables']['contact_tables']['Row'];

interface Restaurant {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  contact_tables?: any[];
}

interface ContactTableWithDetails extends ContactTable {
  restaurant?: Restaurant | null;
  participants?: any[] | null;
  participant_count?: number;
}

export default function CustomerFavorites() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<ContactTableWithDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  

  // Lade Favoriten
  const loadFavorites = async () => {
    if (!session || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Favorisierte Kontakttische abrufen
      const { data: favorites, error: favoritesError } = await supabase
        .from('favorites')
        .select('restaurant_id')
        .eq('user_id', user.id);
      
      if (favoritesError) {
        console.error('Fehler beim Laden der Favoriten:', favoritesError);
        setError('Fehler beim Laden deiner Favoriten. Bitte versuche es später erneut.');
        setLoading(false);
        return;
      }
      
      if (favorites && favorites.length > 0) {
        // IDs der favorisierten Restaurants extrahieren
        const favoriteRestaurantIds = favorites.map(f => f.restaurant_id);
        
        // Favorisierte Restaurants mit ihren aktuellen Kontakttischen abrufen
        const { data: favoriteRestaurants, error: favoriteRestaurantsError } = await supabase
          .from('restaurants')
          .select(`
            *,
            contact_tables(*)
          `)
          .in('id', favoriteRestaurantIds);
        
        if (favoriteRestaurantsError) {
          console.error('Fehler beim Laden der favorisierten Restaurants:', favoriteRestaurantsError);
          setError('Fehler beim Laden deiner Favoriten. Bitte versuche es später erneut.');
          setLoading(false);
          return;
        }
        
        // Verarbeite die Restaurants und ihre Kontakttische
        if (favoriteRestaurants && favoriteRestaurants.length > 0) {
          // Extrahiere alle Kontakttische aus den Restaurants und füge Restaurant-Details hinzu
          const allTables: ContactTableWithDetails[] = [];
          
          favoriteRestaurants.forEach((restaurant: Restaurant) => {
            if (restaurant.contact_tables && restaurant.contact_tables.length > 0) {
              const tablesWithRestaurant = restaurant.contact_tables.map((table: any) => ({
                ...table,
                restaurant: {
                  id: restaurant.id,
                  name: restaurant.name,
                  address: restaurant.address,
                  city: restaurant.city,
                  postal_code: restaurant.postal_code
                }
              }));
              allTables.push(...tablesWithRestaurant);
            }
          });
          
          // Sortiere nach Datum
          allTables.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
          
          setFavorites(allTables);
        } else {
          setFavorites([]);
        }
      } else {
        setFavorites([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Favoriten:', error);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.');
      setLoading(false);
    }
  };

  // Entferne ein Kontakttisch aus den Favoriten
  const removeFavorite = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('restaurant_id', id);
      
      if (error) {
        throw error;
      }
      
      // Aktualisiere die Liste der Favoriten
      setFavorites(favorites.filter(fav => fav.id !== id));
    } catch (error) {
      console.error('Fehler beim Entfernen des Favoriten:', error);
      setError('Der Favorit konnte nicht entfernt werden. Bitte versuche es später erneut.');
    }
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    // Benutzer ist eingeloggt
    if (user) {
      try {
        const userRole = ((user.user_metadata?.role || '') + '').toUpperCase();
        
        // Akzeptiere sowohl 'CUSTOMER' als auch 'USER' als gültige Rollen
        if (userRole !== 'CUSTOMER' && userRole !== 'USER') {
          router.push('/');
          return;
        }
        
        // Lade Favoriten
        loadFavorites();
      } catch (error) {
        console.error('Fehler bei der Rollenprüfung:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [session, user, authLoading, router]);

  // Formatierungsfunktion für Datum und Uhrzeit
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex">
        <CustomerSidebar activePage="favorites" />
        <main className="flex-grow bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Meine Favoriten</h1>
              </div>
              
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700">{error}</p>
                </div>
              )}
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-12">
                  <FiHeart className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Keine Favoriten</h3>
                  <p className="mt-1 text-sm text-gray-500">Du hast noch keine Kontakttische zu deinen Favoriten hinzugefügt.</p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => router.push('/contact-tables')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Kontakttische entdecken
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {favorites.map((table) => {
                    const { date, time } = formatDateTime(table.datetime || '');
                    return (
                      <div
                        key={table.id}
                        className="bg-white overflow-hidden shadow rounded-lg transition-all duration-300 hover:shadow-lg"
                      >
                        <div className="px-4 py-5 sm:p-6">
                          <h3 className="text-lg font-medium text-gray-900 truncate">{table.title}</h3>
                          
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <FiMapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            <p className="truncate">{table.restaurant?.name || 'Unbekanntes Restaurant'}</p>
                          </div>
                          
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <FiCalendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            <p>{date}</p>
                          </div>
                          
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <FiClock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            <p>{time} Uhr</p>
                          </div>
                          
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <FiUsers className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            <p>{table.participant_count || 0}/{table.max_participants} Teilnehmer</p>
                          </div>
                          
                          <div className="mt-4 flex justify-between">
                            <Link href={`/contact-tables/${table.id}`}>
                              <button
                                type="button"
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Details
                              </button>
                            </Link>
                            
                            <button
                              type="button"
                              onClick={() => removeFavorite(table.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <FiTrash2 className="mr-1.5 h-4 w-4" />
                              Entfernen
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
