import { useState, useMemo, FC } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiMap, FiGrid, FiSearch, FiStar, FiChevronDown, FiMapPin } from 'react-icons/fi';
import PageLayout from '@/components/PageLayout';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import dynamic from 'next/dynamic';

const RestaurantMap = dynamic(
  () => import('@/components/RestaurantMap'),
  {
    ssr: false,
    loading: () => <div className="h-[600px] w-full bg-gray-200 flex items-center justify-center rounded-xl"><p>Karte wird geladen...</p></div>
  }
);
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';

// This is the single source of truth for the data structure used by the page components.
// It ensures all properties are non-nullable, as expected by the rendering logic.
interface RestaurantPageItem {
  id: string;
  name: string;
  address: string;
  cuisine: string;
  city: string;
  postalCode: string;
  priceRange: string;
  imageUrl: string;
  avgRating: number;
  totalRatings: number;
  latitude: number | null;
  longitude: number | null;
  description: string;
  capacity: number;
  offerTableToday: boolean;
}

// Props for the entire page
interface RestaurantsPageProps {
  restaurants: RestaurantPageItem[];
  initialFilters: any;
  error?: string;
}

// Hilfsfunktion zum Rendern der Sterne
const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <FiStar
        key={i}
        className={`inline-block h-5 w-5 ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
      />
    );
  }
  return (
    <div className="flex-grow mr-2 md:mr-4 flex items-center gap-4">
      {stars}
      <span className="ml-2 text-sm text-gray-500">{rating > 0 ? rating.toFixed(1) : 'Neu'}</span>
    </div>
  );
};

// Preis-Kategorien für den Filter
const priceCategories = [
  { value: 'all', label: 'Alle Preise' },
  { value: '€', label: 'Günstig (€)' },
  { value: '€€', label: 'Mittel (€€)' },
  { value: '€€€', label: 'Gehoben (€€€)' },
];

const RestaurantsPage: FC<RestaurantsPageProps> = ({ restaurants, initialFilters, error }) => {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [location, setLocation] = useState(initialFilters.location || '');
  const [radius, setRadius] = useState(initialFilters.radius || '25');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query: { [key: string]: string } = {};
    if (searchTerm) query.search = searchTerm;
    if (location) query.location = location;
    if (location && radius) query.radius = radius; // Radius only makes sense with a location

    router.push({
      pathname: '/restaurants',
      query,
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setLocation('');
    setRadius('25');
    router.push('/restaurants');
  };



  return (
    <PageLayout title="Restaurants">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-2">Entdecke Restaurants</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Finde den perfekten Ort für dein nächstes Treffen am contact-table.</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md mb-8 sticky top-20 z-10">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            <div className="relative lg:col-span-4">
              <label htmlFor="search-term" className="block text-sm font-medium text-gray-700 mb-1">Restaurantname</label>
              <FiSearch className="absolute left-3 bottom-3 text-gray-400" size={20} />
              <input
                id="search-term"
                type="text"
                placeholder="z.B. Bella Italia"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="relative lg:col-span-4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Ort oder PLZ</label>
              <FiMapPin className="absolute left-3 bottom-3 text-gray-400" size={20} />
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="z.B. Berlin oder 10115"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="relative lg:col-span-2">
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">Umkreis</label>
              <select
                id="radius"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                disabled={!location} // Disable radius if no location is entered
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <button
                type="submit"
                className="w-full bg-primary-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 flex items-center justify-center"
              >
                <FiSearch className="mr-2"/> Suchen
              </button>
            </div>
          </form>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-500">
            <span>
              {restaurants.length} {restaurants.length === 1 ? 'Restaurant' : 'Restaurants'} gefunden
            </span>
            {(initialFilters.search || initialFilters.location) && (
              <button
                onClick={resetFilters}
                className="ml-4 text-primary-500 hover:text-primary-700 text-sm font-medium"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              <FiGrid className="mr-2" /> Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center px-3 py-2 transition-colors ${viewMode === 'map' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              <FiMap className="mr-2" /> Karte
            </button>
          </div>
        </div>

        {error && <div className="text-center py-10 text-red-600 bg-red-50 rounded-lg"><p>{error}</p></div>}
        {restaurants.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="inline-block bg-yellow-100 p-4 rounded-full">
              <FiSearch size={32} className="text-yellow-600" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-gray-800">Keine Restaurants gefunden</h3>
            <p className="mt-2 text-gray-500">Bitte passen Sie Ihre Suchkriterien an.</p>
          </div>
        )}

        {viewMode === 'map' && restaurants.length > 0 && (
          <div className="mb-12 rounded-xl overflow-hidden shadow-lg">
            <RestaurantMap restaurants={restaurants} height="600px" />
          </div>
        )}

        {viewMode === 'grid' && restaurants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {restaurants.map((restaurant) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => router.push(`/restaurants/${restaurant.id}`)}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col group"
              >
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  {restaurant.imageUrl ? (
                    <Image
                      src={restaurant.imageUrl}
                      alt={`Bild von ${restaurant.name}`}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400">Kein Bild</span>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-gray-800 truncate">{restaurant.name}</h3>
                  <p className="text-gray-500 text-sm mb-3">{restaurant.cuisine}</p>
                  <div className="flex items-center mb-4">
                    {renderStars(restaurant.avgRating)}
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-sm text-gray-600">{restaurant.city}, {restaurant.postalCode}</p>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      {restaurant.priceRange}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default RestaurantsPage;

export const getServerSideProps: GetServerSideProps<RestaurantsPageProps> = async (context) => {
  const supabase = createClient(context);
  const search = Array.isArray(context.query.search) ? context.query.search[0] : context.query.search;
  const location = Array.isArray(context.query.location) ? context.query.location[0] : context.query.location;
  const radius = Array.isArray(context.query.radius) ? context.query.radius[0] : context.query.radius;
  let restaurantsData: any[] = [];


  try {
    if (typeof location === 'string' && location && typeof radius === 'string' && radius) {
      // --- Geocoding Step ---
      // IMPORTANT: You need a geocoding service to convert the location string to coordinates.
      // I'll use a placeholder here. Replace this with a real API call.
      // Add your API Key to .env.local (e.g., OPENCAGE_API_KEY)
      const geocodingUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${process.env.OPENCAGE_API_KEY}`;
      
      let lat: number | null = null;
      let lng: number | null = null;

      try {
        const geoResponse = await fetch(geocodingUrl);
        const geoData = await geoResponse.json();

        if (geoData.results && geoData.results.length > 0) {
          lat = geoData.results[0].geometry.lat;
          lng = geoData.results[0].geometry.lng;
        } else {
          throw new Error('Geocoding failed to find coordinates.');
        }
      } catch (geoError) {
        console.error('Geocoding API error:', geoError);
        // Return an empty list with an error message if geocoding fails
        return {
          props: {
            restaurants: [],
            initialFilters: { ...context.query },
            error: `Ort "${location}" konnte nicht gefunden werden. Bitte versuchen Sie es mit einer anderen Eingabe.`,
          },
        };
      }

      // --- Database Query for Nearby Restaurants ---
      if (lat && lng) {
        const { data, error } = await supabase.rpc('nearby_restaurants', {
          lat: lat,
          long: lng,
          radius_meters: parseInt(radius, 10) * 1000 // Convert km to meters
        });

        if (error) {
          throw error;
        }
        restaurantsData = data;
      }

    } else {
      // --- Standard Text Search ---
      const where: Prisma.RestaurantWhereInput = { isActive: true };
      if (typeof search === 'string' && search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { postal_code: { contains: search, mode: 'insensitive' } },
        ];
      } else if (typeof location === 'string' && location) {
        where.OR = [
          { city: { contains: location, mode: 'insensitive' } },
          { postal_code: { contains: location, mode: 'insensitive' } },
        ];
      }

      restaurantsData = await prisma.restaurant.findMany({
        where,
        include: {
          ratings: { select: { value: true } },
        },
      });
    }

    const restaurants: RestaurantPageItem[] = restaurantsData.map((r) => {
      const ratingCount = r.ratings?.length ?? 0;
      const avgRating = ratingCount > 0
        ? r.ratings.reduce((acc: number, rating: { value: number }) => acc + rating.value, 0) / ratingCount
        : 0;

      return {
        id: r.id,
        name: r.name ?? 'Unbekanntes Restaurant',
        description: r.description ?? 'Keine Beschreibung verfügbar.',
        address: r.address ?? 'Keine Adresse',
        city: r.city ?? 'Unbekannte Stadt',
        postalCode: r.postal_code ?? r.postalCode ?? '',
        cuisine: r.cuisine ?? 'Unbekannt',
        imageUrl: r.imageUrl || '/images/placeholder-restaurant.webp',
        capacity: r.capacity ?? 0,
        offerTableToday: r.offerTableToday ?? false,
        priceRange: r.priceRange ?? 'N/A',
        latitude: r.latitude,
        longitude: r.longitude,
        avgRating,
        totalRatings: ratingCount,
      };
    });

    return {
      props: {
        restaurants: JSON.parse(JSON.stringify(restaurants)),
        initialFilters: { ...context.query },
      },
    };
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return {
      props: {
        restaurants: [],
        initialFilters: { ...context.query },
        error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      },
    };
  }
};
