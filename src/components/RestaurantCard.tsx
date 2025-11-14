import React from 'react';
import Link from 'next/link';
import { RestaurantPageItem } from '../types/restaurants';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiStar, FiMapPin, FiUsers, FiClock, FiHeart } from 'react-icons/fi';
import { userApi } from '../utils/api';

export interface RestaurantCardProps {
  restaurant: RestaurantPageItem;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  showDistance?: boolean;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  isFavorite = false,
  onFavoriteToggle,
  showDistance = false,
}) => {
  const [favorite, setFavorite] = React.useState(isFavorite);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    try {
      setIsLoading(true);

      if (favorite) {
        await userApi.removeFavorite(restaurant.id);
      } else {
        await userApi.addFavorite(restaurant.id);
      }

      setFavorite(!favorite);

      if (onFavoriteToggle) {
        onFavoriteToggle(restaurant.id, !favorite);
      }
    } catch (error) {
      console.error('Fehler beim Ändern des Favoritenstatus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Formatiere die Entfernung
  const formatDistance = (distance?: number) => {
    if (!distance) return null;

    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1).replace('.', ',')} km`;
  };

  const { id, slug, name, cuisine, city, avg_rating, total_ratings, image_url, distance_in_meters } = restaurant;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-neutral-200 h-full flex flex-col"
    >
      {slug ? (
        <Link href={`/restaurants/${slug}`} className="block h-full">
          <>
        <div className="relative">
          <div className="h-48 w-full relative">
            <Image
              src={image_url || '/images/logo.svg'}
                            alt={name || 'Restaurant'}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFavoriteToggle}
            className={`absolute top-3 right-3 p-2 rounded-full ${
              favorite ? 'bg-primary-500 text-white' : 'bg-white text-secondary-800'
            } shadow-md z-10`}
            disabled={isLoading}
          >
            <FiHeart size={20} className={favorite ? 'fill-white' : ''} />
          </motion.button>

                    {restaurant.offer_table_today && (
            <div className="absolute top-3 left-3 bg-primary-500 text-secondary-900 px-3 py-1 rounded-full text-sm font-bold shadow-md">
              Heute verfügbar
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center">
              <div className="bg-white text-secondary-900 rounded-lg px-2 py-1 flex items-center shadow-md">
                <FiStar className="text-yellow-500 mr-1" size={16} />
                {(() => {
                  const r = Number(avg_rating ?? 0);
                  const has = !isNaN(r) && r > 0;
                  return has ? (
                    <>
                      <span className="font-bold">{r.toFixed(1).replace('.', ',')}</span>
                      <span className="text-xs text-secondary-600 ml-1">({Number(total_ratings ?? 0)})</span>
                    </>
                  ) : (
                    <span className="text-sm text-secondary-600">Neu</span>
                  );
                })()}
              </div>

              {showDistance && distance_in_meters != null && (
                <div className="bg-white text-secondary-900 rounded-lg px-2 py-1 flex items-center shadow-md ml-2">
                  <FiMapPin className="text-primary-500 mr-1" size={16} />
                  <span className="font-bold text-sm">{formatDistance(distance_in_meters / 1000)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 flex-grow">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-bold text-gray-800 truncate">{name}</h3>
          </div>

          <div className="flex items-center text-secondary-600 mb-2">
            <FiMapPin size={16} className="mr-1 flex-shrink-0" />
            <p className="text-sm text-gray-500">{cuisine} • {city}</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-neutral-100 text-secondary-700 px-2 py-1 rounded-md text-xs font-medium">
              {cuisine}
            </span>
            <span className="bg-neutral-100 text-secondary-700 px-2 py-1 rounded-md text-xs font-medium flex items-center">
              <FiUsers size={14} className="mr-1" />
              bis {restaurant.capacity} Personen
            </span>
          </div>
          
          <p className="text-secondary-600 text-sm line-clamp-2 mb-3">{restaurant.description}</p>
        </div>
        
        <div className="p-4 pt-0 mt-auto">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-primary-50 hover:bg-primary-100 border-2 border-primary-500 text-primary-700 font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-all"
          >
            <FiClock className="mr-2" size={18} />
            Tisch anfragen
          </motion.div>
        </div>
          </>
        </Link>
      ) : (
        <Link href={`/restaurants/${id}`} className="block h-full">
          {/* Render non-clickable card content if no slug */}
          <div className="relative">
            <div className="h-48 w-full relative">
              <Image
                src={image_url || '/images/logo.svg'}
                alt={name || 'Restaurant'}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            {restaurant.offer_table_today && (
              <div className="absolute top-3 left-3 bg-primary-500 text-secondary-900 px-3 py-1 rounded-full text-sm font-bold shadow-md">
                Heute verfügbar
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex items-center">
                <div className="bg-white text-secondary-900 rounded-lg px-2 py-1 flex items-center shadow-md">
                  <FiStar className="text-yellow-500 mr-1" size={16} />
                  {(() => {
                    const r = Number(avg_rating ?? 0);
                    const has = !isNaN(r) && r > 0;
                    return has ? (
                      <>
                        <span className="font-bold">{r.toFixed(1).replace('.', ',')}</span>
                        <span className="text-xs text-secondary-600 ml-1">({Number(total_ratings ?? 0)})</span>
                      </>
                    ) : (
                      <span className="text-sm text-secondary-600">Neu</span>
                    );
                  })()}
                </div>
                {showDistance && distance_in_meters != null && (
                  <div className="bg-white text-secondary-900 rounded-lg px-2 py-1 flex items-center shadow-md ml-2">
                    <FiMapPin className="text-primary-500 mr-1" size={16} />
                    <span className="font-bold text-sm">{formatDistance(distance_in_meters / 1000)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 flex-grow">
            <h3 className="text-lg font-bold text-gray-800 truncate">{name}</h3>
            <div className="flex items-center text-secondary-600 mb-2">
              <FiMapPin size={16} className="mr-1 flex-shrink-0" />
              <p className="text-sm text-gray-500">{cuisine} • {city}</p>
            </div>
            <p className="text-secondary-600 text-sm line-clamp-2 mb-3">{restaurant.description}</p>
          </div>
          <div className="p-4 pt-0 mt-auto">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-primary-50 hover:bg-primary-100 border-2 border-primary-500 text-primary-700 font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-all"
            >
              <FiClock className="mr-2" size={18} />
              Details anzeigen
            </motion.div>
          </div>
        </Link>
      )}
    </motion.div>
  );
};

export default RestaurantCard;
