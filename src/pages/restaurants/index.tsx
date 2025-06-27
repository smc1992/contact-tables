import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiSearch, FiMapPin, FiStar, FiFilter, FiChevronDown, FiGrid, FiMap } from 'react-icons/fi';
import PageLayout from '../../components/PageLayout';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Dynamischer Import der Kartenkomponente, um SSR-Probleme zu vermeiden
const RestaurantMap = dynamic(() => import('../../components/RestaurantMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Karte wird geladen...</p>
    </div>
  )
});

// Typdefinitionen
interface Restaurant {
  id: number;
  name: string;
  description?: string;
  address: string;
  city: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  cuisine?: string;
  price_range?: string;
  image_url?: string;
  avgRating?: number;
  ratings?: { value: number }[];
  distance?: number;
}

export default function RestaurantsPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  // Preiskategorien
  const priceCategories = [
    { value: 'all', label: 'Alle Preisklassen' },
    { value: '€', label: '€ (günstig)' },
    { value: '€€', label: '€€ (mittel)' },
    { value: '€€€', label: '€€€ (gehoben)' },
  ];

  // Restaurants laden
  useEffect(() => {
    const fetchRestaurants = async (currentSearchTerm: string = '') => {
      try {
        setLoading(true);
        setError(null);
        let params: any = { limit: 10 }; // Standard-Limit

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              params.latitude = position.coords.latitude;
              params.longitude = position.coords.longitude;
              if (currentSearchTerm) params.searchTerm = currentSearchTerm;
              // Wenn kein Suchbegriff, aber Standort vorhanden ist, wird nach Standort gesucht
              // Wenn auch Suchbegriff vorhanden, wird beides kombiniert
              const response = await axios.get('/api/restaurants/search', { params });
              if (response.data && response.data.restaurants) {
                setRestaurants(response.data.restaurants);
                setFilteredRestaurants(response.data.restaurants);
              }
              setLoading(false);
            },
            async (geoError) => {
              console.warn('Geolocation error:', geoError.message);
              // Fallback, wenn Geolokalisierung fehlschlägt oder nicht erlaubt ist
              params.searchTerm = currentSearchTerm || 'Restaurants'; // Fallback-Suchbegriff
              const response = await axios.get('/api/restaurants/search', { params });
              if (response.data && response.data.restaurants) {
                setRestaurants(response.data.restaurants);
                setFilteredRestaurants(response.data.restaurants);
              }
              setLoading(false);
            }
          );
        } else {
          // Fallback, wenn Geolocation API nicht verfügbar ist
          console.warn('Geolocation is not supported by this browser.');
          params.searchTerm = currentSearchTerm || 'Restaurants'; // Fallback-Suchbegriff
          const response = await axios.get('/api/restaurants/search', { params });
          if (response.data && response.data.restaurants) {
            setRestaurants(response.data.restaurants);
            setFilteredRestaurants(response.data.restaurants);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Restaurants:', err);
        setError('Die Restaurants konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
        setLoading(false);
      }
    };

    fetchRestaurants(searchTerm);
  }, []);

  // Alle verfügbaren Küchen extrahieren
  const cuisines = Array.from(
    new Set(restaurants.map(r => r.cuisine || 'Sonstige'))
  );

  // Suche und Filter anwenden
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    applyFilters(term, cuisineFilter, priceFilter);
  };
  
  const handleCuisineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cuisine = e.target.value;
    setCuisineFilter(cuisine);
    applyFilters(searchTerm, cuisine, priceFilter);
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const price = e.target.value;
    setPriceFilter(price);
    applyFilters(searchTerm, cuisineFilter, price);
  };
  
  const applyFilters = (term: string, cuisine: string, price: string) => {
    let filtered = restaurants;
    
    // Textsuche anwenden
    if (term) {
      filtered = filtered.filter(restaurant => 
        restaurant.name.toLowerCase().includes(term.toLowerCase()) ||
        restaurant.description?.toLowerCase().includes(term.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(term.toLowerCase()) ||
        restaurant.city.toLowerCase().includes(term.toLowerCase())
      );
    }
    
    // Küchen-Filter anwenden
    if (cuisine !== 'all') {
      filtered = filtered.filter(restaurant => 
        (restaurant.cuisine || 'Sonstige') === cuisine
      );
    }
    
    // Preis-Filter anwenden
    if (price !== 'all') {
      filtered = filtered.filter(restaurant => 
        restaurant.price_range === price
      );
    }
    
    setFilteredRestaurants(filtered);
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setCuisineFilter('all');
    setPriceFilter('all');
    setFilteredRestaurants(restaurants);
  };

  // Sternebewertung rendern
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            } w-4 h-4`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <PageLayout>
      {/* Hero-Bereich */}
      <section className="bg-gradient-to-b from-primary-500 to-primary-700 text-white py-16 -mt-8 mb-12">
        <div className="container mx-auto px-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-6 text-center"
          >
            Unsere Partnerrestaurants
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl max-w-3xl mx-auto text-center mb-8"
          >
            Entdecken Sie Restaurants, die Kontakttische anbieten und werden Sie Teil einer wachsenden Gemeinschaft.
          </motion.p>
          
          {/* Suchleiste */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative bg-white rounded-full shadow-lg overflow-hidden">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Restaurant oder Küche suchen..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-12 pr-4 py-4 border-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-800"
              />
            </div>
          </motion.div>
        </div>
      </section>
      
      <div className="container mx-auto px-4">
        {/* Filter-Bereich */}
        <div className="mb-8 bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h2 className="text-xl font-semibold text-secondary-800 mb-4 md:mb-0 flex items-center">
              <FiFilter className="mr-2" /> Filter
            </h2>
            
            <div className="flex flex-wrap gap-4">
              {/* Küchen-Filter */}
              <div className="relative">
                <select
                  value={cuisineFilter}
                  onChange={handleCuisineChange}
                  className="appearance-none bg-white border border-gray-200 rounded-lg py-2 pl-4 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Alle Küchen</option>
                  {cuisines.map(cuisine => (
                    <option key={cuisine} value={cuisine}>{cuisine}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
              
              {/* Preis-Filter */}
              <div className="relative">
                <select
                  value={priceFilter}
                  onChange={handlePriceChange}
                  className="appearance-none bg-white border border-gray-200 rounded-lg py-2 pl-4 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {priceCategories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
              
              {/* Ansichtsumschalter */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center px-3 py-2 ${
                    viewMode === 'grid' 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiGrid className="mr-1" /> Liste
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center px-3 py-2 ${
                    viewMode === 'map' 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiMap className="mr-1" /> Karte
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 flex justify-between items-center">
            <span>
              {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'Restaurant' : 'Restaurants'} gefunden
            </span>
            {(searchTerm || cuisineFilter !== 'all' || priceFilter !== 'all') && (
              <button
                onClick={resetFilters}
                className="text-primary-500 hover:text-primary-700 text-sm font-medium"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        </div>

        {/* Lade-Animation */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        )}

        {/* Fehlermeldung */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Keine Restaurants gefunden */}
        {!loading && !error && filteredRestaurants.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">Keine Restaurants gefunden. Bitte passen Sie Ihre Suchkriterien an.</p>
              </div>
            </div>
          </div>
        )}

        {/* Kartenansicht */}
        {viewMode === 'map' && !loading && filteredRestaurants.length > 0 && (
          <div className="mb-12">
            <RestaurantMap restaurants={filteredRestaurants} height="600px" />
          </div>
        )}

        {/* Restaurant-Grid */}
        {viewMode === 'grid' && !loading && filteredRestaurants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {filteredRestaurants.map((restaurant) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="h-48 bg-gray-200 relative">
                  {restaurant.image_url ? (
                    <img
                      src={restaurant.image_url}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-400">Kein Bild verfügbar</span>
                    </div>
                  )}
                  {restaurant.price_range && (
                    <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-700">
                      {restaurant.price_range}
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{restaurant.name}</h3>
                    {restaurant.avgRating !== undefined && (
                      <div className="ml-2">
                        {renderStars(restaurant.avgRating)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-4">
                    <FiMapPin className="mr-1 text-primary-500" />
                    <span className="text-sm">{restaurant.address}, {restaurant.city}</span>
                  </div>
                  
                  {restaurant.cuisine && (
                    <div className="mb-4">
                      <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-700">
                        {restaurant.cuisine}
                      </span>
                    </div>
                  )}
                  
                  {restaurant.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{restaurant.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => router.push(`/restaurants/${restaurant.id}`)}
                      className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                    >
                      Details ansehen
                    </button>
                    
                    {restaurant.distance !== undefined && (
                      <span className="text-sm text-gray-500">
                        {restaurant.distance < 1 
                          ? `${Math.round(restaurant.distance * 1000)} m` 
                          : `${restaurant.distance.toFixed(1)} km`}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
