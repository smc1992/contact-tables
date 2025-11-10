import { useState, useEffect } from 'react';
import { type Database } from '../types/supabase';
import Link from 'next/link';
import { FiCalendar, FiClock, FiMapPin, FiHeart, FiInfo, FiPhone, FiGlobe } from 'react-icons/fi';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

type ContactTable = Database['public']['Tables']['contact_tables']['Row'];
type Restaurant = Database['public']['Tables']['restaurants']['Row'];

// Simplified type, does not include participants anymore
type ContactTableWithRestaurant = ContactTable & {
  restaurant: Restaurant | null;
};

interface ContactTablesListProps {
  initialContactTables: ContactTableWithRestaurant[];
  userRole: string;
}

export default function ContactTablesList({ initialContactTables, userRole }: ContactTablesListProps) {
  // This component now relies entirely on the props passed to it.
  // The internal data fetching logic has been removed to prevent the error.
  const [contactTables] = useState<ContactTableWithRestaurant[]>(initialContactTables || []);
  const [joining, setJoining] = useState<string | null>(null); // Track joining status by table id
  const [reserveOpen, setReserveOpen] = useState<string | null>(null); // Show reservation CTA per table
  const [favorites, setFavorites] = useState<string[]>([]); // Array of restaurant IDs that are favorites
  const [favoritesLoading, setFavoritesLoading] = useState<boolean>(true);
  const { user } = useAuth();

  // Lade die Favoriten des Benutzers
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavoritesLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('restaurant_id')
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Fehler beim Laden der Favoriten:', error);
        } else {
          // Extrahiere die Restaurant-IDs
          const favoriteIds = data.map(fav => fav.restaurant_id);
          setFavorites(favoriteIds);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Favoriten:', err);
      } finally {
        setFavoritesLoading(false);
      }
    };
    
    loadFavorites();
  }, [user]);

  const handleJoin = async (tableId: string) => {
    setJoining(tableId);
    try {
      const response = await fetch('/api/contact/request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactTableId: tableId, action: 'join' }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Beitreten');
      }
      alert('Erfolgreich beigetreten! Die Seite wird neu geladen, um die Teilnehmerzahl zu aktualisieren.');
      // Reload the page to reflect the change in participants
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJoining(null);
    }
  };

  const toggleReserve = (tableId: string) => {
    setReserveOpen(prev => (prev === tableId ? null : tableId));
  };
  
  // Füge ein Restaurant zu den Favoriten hinzu oder entferne es
  const toggleFavorite = async (restaurantId: string) => {
    if (!user) {
      alert('Bitte melde dich an, um Favoriten zu speichern.');
      return;
    }
    
    const isFavorite = favorites.includes(restaurantId);
    
    try {
      if (isFavorite) {
        // Entferne aus Favoriten
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', restaurantId);
          
        if (error) throw error;
        
        // Aktualisiere den lokalen Zustand
        setFavorites(favorites.filter(id => id !== restaurantId));
      } else {
        // Füge zu Favoriten hinzu
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            restaurant_id: restaurantId
          });
          
        if (error) throw error;
        
        // Aktualisiere den lokalen Zustand
        setFavorites([...favorites, restaurantId]);
      }
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Favoriten:', err);
      alert('Es gab ein Problem beim Aktualisieren deiner Favoriten. Bitte versuche es später erneut.');
    }
  };

  if (!contactTables || contactTables.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-neutral-700">Keine Kontakttische gefunden</h3>
        <p className="text-neutral-500 mt-2">Derzeit sind keine Kontakttische verfügbar. Schau später noch einmal vorbei.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {contactTables.filter(table => table.restaurant).map((table) => {
        // Participant count is removed as it's causing issues.
        // We can display max_participants directly.
        const availableSeats = table.max_participants;
        const dt = table.datetime ? new Date(table.datetime) : null;
        
        return (
          <div key={table.id} className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl flex flex-col">
            <div className="p-6 flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-neutral-500 flex items-center">
                    <FiCalendar className="mr-2" />
                    {dt ? dt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                  </p>
                  {dt && (
                    <p className="text-sm text-neutral-500 flex items-center mt-1">
                      <FiClock className="mr-2" />
                      {dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 text-xs font-semibold text-primary-800 bg-primary-100 rounded-full">
                  {/* Displaying max participants instead of available seats */}
                  {table.max_participants} Plätze
                </span>
              </div>

              <h3 className="text-xl font-bold text-neutral-800 mb-2">{table.title}</h3>

              {table.restaurant && (
                <div className="text-sm text-neutral-600 mb-4">
                  <p className="flex items-center">
                    <FiMapPin className="mr-2" />
                    <Link href={`/restaurants/${table.restaurant.id}`} className="hover:underline font-semibold">
                      {table.restaurant.name}
                    </Link>
                  </p>
                  <p className="ml-6">{table.restaurant.address}, {table.restaurant.city}</p>
                </div>
              )}

              

              {table.description && (
                 <div className="mb-4">
                  <h4 className="font-semibold text-sm text-neutral-700 mb-2 flex items-center"><FiInfo className="mr-2"/>Beschreibung</h4>
                  <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-md">{table.description}</p>
                </div>
              )}
            </div>

            <div className="bg-neutral-50 px-6 py-4">
              <div className="flex gap-3 items-center mb-3">
                {userRole === 'CUSTOMER' && (
                  <button 
                    onClick={() => handleJoin(table.id)}
                    disabled={joining === table.id}
                    className="flex-1 bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {joining === table.id ? 'Beitreten...' : 'Teilnehmen'}
                  </button>
                )}

                <button
                  onClick={() => toggleReserve(table.id)}
                  className="flex-1 border border-primary-300 text-primary-700 font-medium py-2 px-4 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Reservieren
                </button>

                {user && table.restaurant && (
                  <button
                    onClick={() => toggleFavorite(table.restaurant?.id || '')}
                    disabled={favoritesLoading}
                    className={`p-2 rounded-full flex items-center justify-center transition-colors ${
                      favorites.includes(table.restaurant?.id || '') 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={favorites.includes(table.restaurant?.id || '') ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                  >
                    <FiHeart 
                      className={`h-5 w-5 ${favorites.includes(table.restaurant?.id || '') ? 'fill-current' : ''}`} 
                    />
                  </button>
                )}
              </div>
              {reserveOpen === table.id && (
                <div className="mt-2 bg-white border border-neutral-200 rounded-lg p-3 text-sm text-neutral-700">
                  <div className="flex flex-wrap gap-3">
                    {table.restaurant?.phone && (
                      <a href={`tel:${table.restaurant.phone}`} className="inline-flex items-center px-3 py-1 rounded bg-primary-50 text-primary-700 hover:bg-primary-100">
                        <FiPhone className="mr-2" />
                        Anrufen
                      </a>
                    )}
                    {(table.restaurant?.website || table.restaurant?.booking_url) && (
                      <a href={table.restaurant?.website || table.restaurant?.booking_url || undefined} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded bg-neutral-100 text-neutral-800 hover:bg-neutral-200">
                        <FiGlobe className="mr-2" />
                        Zur Webseite
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-3">
                <Link href={`/contact-tables/${table.id}`} className="block">
                  <button className="w-full border border-neutral-300 text-neutral-700 font-medium py-2 px-4 rounded-lg hover:bg-neutral-100 transition-colors">
                    Details ansehen
                  </button>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
