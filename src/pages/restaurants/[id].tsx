import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiPhone, FiClock, FiGlobe, FiStar, FiCalendar, FiUsers, FiInfo, FiHeart } from 'react-icons/fi';
import { createRestaurantMap, Restaurant as RestaurantMapType } from '../../lib/google-maps';
import { Restaurant, Event, Rating } from '@prisma/client';
import PageLayout from '../../components/PageLayout';

// Erweitere die Restaurant-Schnittstelle für die Detailseite
interface RestaurantWithDetails {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  ratings: (Rating & {
    user: {
      id: string;
      name: string;
    };
  })[];
  events: (Event & {
    participants: {
      user: {
        id: string;
        name: string;
      };
    }[];
  })[];
  rating?: number;
  ratingCount?: number;
  imageUrl: string | null;
  cuisine: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  priceRange: string | null;
  formattedAddress: string | null;
}

export default function RestaurantDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [restaurant, setRestaurant] = useState<RestaurantWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRestaurant();
    }
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      const response = await fetch(`/api/restaurants/${id}`);
      if (!response.ok) {
        throw new Error('Restaurant nicht gefunden');
      }
      const data = await response.json();
      setRestaurant(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error || 'Restaurant nicht gefunden'}</p>
      </div>
    );
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="relative h-64 md:h-96 bg-gray-200 -mt-8 mb-8 rounded-b-3xl overflow-hidden">
        {restaurant.imageUrl ? (
          <img 
            src={restaurant.imageUrl} 
            alt={restaurant.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-600 to-secondary-600 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-white">{restaurant.name}</h1>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{restaurant.name}</h1>
              <div className="flex items-center text-white/90">
                <FiMapPin className="mr-2" />
                <span>{restaurant.formattedAddress}, {restaurant.city}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Informationsbereich */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-md p-6 mb-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800 mb-2">Über das Restaurant</h2>
                  {restaurant.cuisine && (
                    <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                      {restaurant.cuisine}
                    </span>
                  )}
                </div>
                <button className="flex items-center space-x-1 text-primary-600 hover:text-primary-800">
                  <FiHeart />
                  <span>Favorit</span>
                </button>
              </div>
              
              <p className="text-gray-700 mb-6">{restaurant.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {restaurant.phone && (
                  <div className="flex items-center text-gray-600">
                    <FiPhone className="mr-3 text-primary-500" />
                    <span>{restaurant.phone}</span>
                  </div>
                )}
                {restaurant.website && (
                  <div className="flex items-center text-gray-600">
                    <FiGlobe className="mr-3 text-primary-500" />
                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      Website besuchen
                    </a>
                  </div>
                )}
                {restaurant.openingHours && (
                  <div className="flex items-center text-gray-600">
                    <FiClock className="mr-3 text-primary-500" />
                    <span>{restaurant.openingHours}</span>
                  </div>
                )}
                {restaurant.priceRange && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-3 text-primary-500 font-bold">€</span>
                    <span>Preisklasse: {restaurant.priceRange}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Bewertungen */}
            {restaurant.rating && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-xl shadow-md p-6 mb-8"
              >
                <h2 className="text-2xl font-bold text-secondary-800 mb-4 flex items-center">
                  <FiStar className="mr-2 text-yellow-500" />
                  Bewertungen
                </h2>
                
                <div className="flex items-center mb-6">
                  <div className="bg-primary-100 text-primary-800 px-4 py-3 rounded-lg text-center mr-4">
                    <div className="text-3xl font-bold">{restaurant.rating.toFixed(1)}</div>
                    <div className="text-sm">von 5</div>
                  </div>
                  <div>
                    <div className="text-yellow-500 flex mb-1">
                      {'★'.repeat(Math.round(restaurant.rating))}
                      {'☆'.repeat(5 - Math.round(restaurant.rating))}
                    </div>
                    <div className="text-gray-500">
                      Basierend auf {restaurant.ratingCount} Bewertungen
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {restaurant.ratings.map((rating) => (
                    <div key={rating.id} className="border border-gray-100 p-4 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">
                          {rating.user?.name || 'Anonym'}
                        </span>
                        <div className="text-yellow-500">
                          {'★'.repeat(rating.value)}
                          {'☆'.repeat(5 - rating.value)}
                        </div>
                      </div>
                      {rating.comment && (
                        <p className="text-gray-600">{rating.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
                    Bewertung abgeben
                  </button>
                </div>
              </motion.div>
            )}

            {/* Kontakttische/Events */}
            {restaurant.events && restaurant.events.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <h2 className="text-2xl font-bold text-secondary-800 mb-4 flex items-center">
                  <FiCalendar className="mr-2 text-primary-500" />
                  Kommende Kontakttische
                </h2>
                
                <div className="space-y-4">
                  {restaurant.events.map((event) => (
                    <div key={event.id} className="border border-gray-100 p-4 rounded-lg hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-lg mb-2 text-secondary-700">{event.title || 'Kontakttisch'}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <FiCalendar className="mr-2" />
                        <span>
                          {new Date(event.datetime).toLocaleString('de-DE', {
                            dateStyle: 'full',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600 mb-3">
                        <FiUsers className="mr-2" />
                        <span>
                          {event.participants.length} / {event.maxParticipants} Teilnehmer
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-gray-600 mb-4">{event.description}</p>
                      )}
                      <button className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-lg transition-colors">
                        Teilnehmen
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
                    Eigenen Kontakttisch erstellen
                  </button>
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="lg:col-span-1">
            {/* Karte */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-md overflow-hidden sticky top-4"
            >
              <div className="h-[400px]" id="restaurant-map" ref={(el) => {
                // Wenn das Element gerendert wurde und restaurant-Daten vorhanden sind
                if (el && restaurant) {
                  // Konvertiere das Restaurant-Objekt in das erwartete Format
                  // Verwende any als Zwischentyp, um Typkonflikte zu vermeiden
                  const mapRestaurant = {
                    id: restaurant.id,
                    name: restaurant.name,
                    latitude: restaurant.latitude,
                    longitude: restaurant.longitude,
                    ratings: restaurant.ratings || [],
                    events: restaurant.events || []
                  } as any;
                  
                  // Initialisiere die Karte mit dem Restaurant
                  setTimeout(() => {
                    createRestaurantMap({
                      restaurants: [mapRestaurant],
                      center: {
                        lat: restaurant.latitude,
                        lng: restaurant.longitude,
                      },
                      zoom: 15,
                      containerId: 'restaurant-map'
                    });
                  }, 100); // Kurze Verzögerung, um sicherzustellen, dass das DOM bereit ist
                }
              }}>
                {/* Die Karte wird hier durch createRestaurantMap initialisiert */}
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">Adresse</h3>
                <p className="text-gray-600 mb-4">{restaurant.formattedAddress}, {restaurant.city}</p>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors block text-center"
                >
                  Route planen
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}