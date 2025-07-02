import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiMapPin, FiUsers, FiCalendar, FiClock, FiStar, FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchForm from '../components/SearchForm';
import RestaurantCard from '../components/RestaurantCard';
import { createClient } from '@/utils/supabase/client';
import { restaurantApi, geoApi } from '../utils/api';
import { GetServerSideProps } from 'next';
import { createClient as createServerClient } from '../utils/supabase/server';
import prisma from '@/lib/prisma';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  imageUrl: string;
  cuisine: string;
  capacity: number;
  avgRating: number;
  totalRatings: number;
  distance?: number;
  offerTableToday?: boolean;
  latitude?: number;
  longitude?: number;
}

interface SearchPageProps {
  initialFavorites: string[];
}

export default function SearchPage({ initialFavorites }: SearchPageProps) {
  const router = useRouter();
  const supabase = createClient();
  const { q: searchQuery, date, time, guests, lat, lng } = router.query;
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchQuery as string || '');
  const [selectedDate, setSelectedDate] = useState(date as string || new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(time as string || '19:00');
  const [guestCount, setGuestCount] = useState(guests as string || '2');
  const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(
    lat && lng ? { latitude: Number(lat), longitude: Number(lng) } : null
  );
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'popularity'>('distance');
  const [filterOpen, setFilterOpen] = useState(false);
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [offerTodayOnly, setOfferTodayOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(initialFavorites);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const resultsPerPage = 10;



  // Führe Suche durch, wenn die Parameter sich ändern
  useEffect(() => {
    if (router.isReady) {
      performSearch();
    }
  }, [router.isReady, router.query, currentPage, sortBy, cuisineFilter, offerTodayOnly]);
  
  // Versuche, den Standort zu ermitteln, wenn keiner vorhanden ist
  useEffect(() => {
    if (!location && !isLoadingLocation) {
      getUserLocation();
    }
  }, [location, isLoadingLocation]);

  const getUserLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const position = await geoApi.getCurrentPosition();
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch (error) {
      console.error('Fehler bei der Geolokalisierung:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchParams: any = {
        searchTerm: searchTerm,
        date: selectedDate,
        time: selectedTime,
        guests: Number(guestCount),
        page: currentPage,
        limit: resultsPerPage,
        sortBy: sortBy,
        cuisine: cuisineFilter,
        offerTableToday: offerTodayOnly,
      };

      if (location) {
        searchParams.latitude = location.latitude;
        searchParams.longitude = location.longitude;
      }
      
      const response = await restaurantApi.search(searchParams);
      
      setRestaurants(response.restaurants || []);
      setTotalResults(response.total || 0);
      setTotalPages(response.totalPages || 1);

    } catch (error) {
      console.error('Fehler bei der Restaurantsuche:', error);
      setRestaurants([]);
      setTotalResults(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchParams: any) => {
    setSearchTerm(searchParams.searchTerm || '');
    setSelectedDate(searchParams.date);
    setSelectedTime(searchParams.time);
    setGuestCount(searchParams.guests);
    if (searchParams.latitude && searchParams.longitude) {
      setLocation({
        latitude: searchParams.latitude,
        longitude: searchParams.longitude
      });
    }
    setCurrentPage(1);
    performSearch();
  };

  const handleFavoriteToggle = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/login');
      return;
    }

    const isFavorite = favorites.includes(id);

    // Optimistic update
    if (isFavorite) {
      setFavorites(prev => prev.filter(favId => favId !== id));
    } else {
      setFavorites(prev => [...prev, id]);
    }

    try {
      const response = await fetch('/api/users/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurantId: id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update favorite status');
      }
    } catch (error) {
      console.error('Fehler beim Umschalten des Favoritenstatus:', error);
      // Revert optimistic update on failure
      if (isFavorite) {
        setFavorites(prev => [...prev, id]);
      } else {
        setFavorites(prev => prev.filter(favId => favId !== id));
      }
      // Optional: Zeige eine Fehlermeldung für den Benutzer an
    }
  };
  
  const applyFilters = () => {
    setCurrentPage(1);
    setFilterOpen(false);
    performSearch();
  };
  
  const resetFilters = () => {
    setCuisineFilter('');
    setOfferTodayOnly(false);
    setSortBy('distance');
    setCurrentPage(1);
    setFilterOpen(false);
    performSearch();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      {/* Search Header */}
      <div className="bg-white shadow-md border-b sticky top-0 z-40 pt-16">
        <div className="container mx-auto px-4 py-6">
          <SearchForm 
            initialValues={{
              searchTerm,
              date: selectedDate,
              time: selectedTime,
              guests: guestCount
            }}
            onSearch={handleSearch}
          />
          
          {/* Filter Bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-secondary-700">
              <span className="font-medium">{totalResults} Ergebnisse</span>
              {searchTerm && (
                <span className="text-sm">für "{searchTerm}"</span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <label htmlFor="sort-by" className="block text-xs font-bold text-primary-600 mb-1">Sortieren nach</label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="py-2 px-3 pr-8 border border-primary-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="distance">Entfernung</option>
                  <option value="rating">Bewertung</option>
                  <option value="popularity">Beliebtheit</option>
                </select>
              </div>
              
              {/* Filter Button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setFilterOpen(true)}
                className="flex items-center gap-2 py-2 px-4 bg-white border border-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50"
              >
                <FiFilter size={16} />
                Filter
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex-grow">
        {/* Restaurant List */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-64"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </motion.div>
            ) : restaurants.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto"
              >
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSearch className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-xl font-medium text-secondary-800 mb-2">
                  Keine Restaurants gefunden
                </h3>
                <p className="text-primary-600">
                  Versuche es mit anderen Suchkriterien oder einem anderen Standort.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restaurants.map((restaurant, index) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      isFavorite={favorites.includes(restaurant.id)}
                      onFavoriteToggle={handleFavoriteToggle}
                      showDistance={true}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg border ${currentPage === 1 ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-white text-primary-800 hover:bg-primary-50'}`}
                      >
                        Zurück
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg ${currentPage === page ? 'bg-secondary-500 text-white' : 'bg-white text-primary-800 hover:bg-primary-50'}`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg border ${currentPage === totalPages ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-white text-primary-800 hover:bg-primary-50'}`}
                      >
                        Weiter
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Filter Modal */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setFilterOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-2xl p-6 z-50 max-w-lg mx-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-secondary-800">Filter</h3>
                <button 
                  onClick={() => setFilterOpen(false)}
                  className="p-2 rounded-full hover:bg-primary-700"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Cuisine Filter */}
                <div>
                  <label htmlFor="cuisine" className="block text-sm font-medium text-secondary-700 mb-2">Küche</label>
                  <select
                    id="cuisine"
                    value={cuisineFilter}
                    onChange={(e) => setCuisineFilter(e.target.value)}
                    className="w-full p-3 border border-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Alle Küchen</option>
                    <option value="Deutsch">Deutsch</option>
                    <option value="Italienisch">Italienisch</option>
                    <option value="Asiatisch">Asiatisch</option>
                    <option value="Amerikanisch">Amerikanisch</option>
                    <option value="Mediterran">Mediterran</option>
                    <option value="Indisch">Indisch</option>
                    <option value="Vegetarisch">Vegetarisch</option>
                    <option value="Vegan">Vegan</option>
                  </select>
                </div>
                
                {/* Offer Today Filter */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="offer-today"
                    checked={offerTodayOnly}
                    onChange={(e) => setOfferTodayOnly(e.target.checked)}
                    className="w-5 h-5 text-primary-500 border-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="offer-today" className="ml-2 text-sm font-medium text-secondary-700">
                    Nur Restaurants, die heute Tische anbieten
                  </label>
                </div>
                
                <div className="flex justify-between pt-4">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 border border-primary-600 rounded-lg text-secondary-700 hover:bg-primary-50"
                  >
                    Zurücksetzen
                  </button>
                  
                  <button
                    onClick={applyFilters}
                    className="px-6 py-2 bg-secondary-500 text-secondary-900 font-medium rounded-lg hover:bg-secondary-600 shadow-md"
                  >
                    Filter anwenden
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<SearchPageProps> = async (context) => {
  const supabase = createServerClient(context);
  const { data: { user } } = await supabase.auth.getUser();

  let favorites: string[] = [];
  if (user) {
    try {
      const userFavorites = await prisma.favorite.findMany({
        where: { userId: user.id },
        select: { restaurantId: true },
      });
      favorites = userFavorites.map(fav => fav.restaurantId);
    } catch (e) {
      console.error("Error fetching favorites:", e);
      // Don't fail the page, just return empty favorites
    }
  }

  return {
    props: {
      initialFavorites: favorites,
    },
  };
}; 