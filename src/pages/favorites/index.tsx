import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../../components/PageLayout';
import { userApi } from '../../utils/api';
import { FiHeart, FiTrash2, FiMapPin, FiStar } from 'react-icons/fi';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Echten API-Aufruf verwenden
        const { data, error } = await userApi.getFavorites();
        
        if (error) {
          console.error('Fehler beim Laden der Favoriten:', error);
          setError('Favoriten konnten nicht geladen werden.');
        } else if (data && Array.isArray(data.favorites)) {
          setFavorites(data.favorites);
        } else {
          // Fallback zu Demo-Daten, wenn keine Favoriten vorhanden sind oder das Format nicht stimmt
          console.log('Keine Favoriten gefunden oder falsches Datenformat, verwende Demo-Daten');
          const demoFavorites = [
            {
              id: 1,
              name: 'Restaurant Bella Italia',
              address: 'Hauptstraße 123, 10115 Berlin',
              image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cmVzdGF1cmFudHxlbnwwfHwwfHw%3D&w=1000&q=80',
              rating: 4.5,
              cuisine: 'Italienisch'
            },
            {
              id: 2,
              name: 'Sushi Palace',
              address: 'Friedrichstraße 45, 10117 Berlin',
              image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8c3VzaGl8ZW58MHx8MHx8&w=1000&q=80',
              rating: 4.8,
              cuisine: 'Japanisch'
            },
            {
              id: 3,
              name: 'Burger House',
              address: 'Alexanderplatz 7, 10178 Berlin',
              image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8OXx8YnVyZ2VyfGVufDB8fDB8fA%3D%3D&w=1000&q=80',
              rating: 4.2,
              cuisine: 'Amerikanisch'
            }
          ];
          
          setFavorites(demoFavorites);
        }
      } catch (err) {
        console.error('Unerwarteter Fehler beim Laden der Favoriten:', err);
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user, router]);

  const removeFavorite = async (id: number) => {
    try {
      // Echten API-Aufruf verwenden
      const { error } = await userApi.removeFavorite(id.toString());
      
      if (error) {
        console.error('Fehler beim Entfernen des Favoriten:', error);
      } else {
        // Bei Erfolg lokal aktualisieren
        setFavorites(favorites.filter(fav => fav.id !== id));
      }
    } catch (err) {
      console.error('Unerwarteter Fehler beim Entfernen des Favoriten:', err);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Favoriten">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FiHeart className="text-primary mr-2 text-xl" />
            <span className="text-gray-500">{favorites.length} Restaurants</span>
          </div>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((restaurant) => (
              <div key={restaurant.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{restaurant.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{restaurant.cuisine}</p>
                  <p className="text-sm text-gray-600 mb-3">{restaurant.address}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1">{restaurant.rating}</span>
                    </div>
                    <button
                      onClick={() => removeFavorite(restaurant.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Von Favoriten entfernen"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiHeart className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-xl font-medium mb-2">Keine Favoriten</h3>
            <p className="text-gray-500 mb-6">Sie haben noch keine Restaurants zu Ihren Favoriten hinzugefügt.</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
            >
              Restaurants entdecken
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
