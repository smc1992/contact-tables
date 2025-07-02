import { useState, useMemo, FC } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiMap, FiGrid, FiSearch, FiStar, FiChevronDown } from 'react-icons/fi';
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
    <div className="flex items-center">
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

const RestaurantsPage: FC<RestaurantsPageProps> = ({ restaurants: initialRestaurants, initialFilters }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const cuisines = useMemo(() => {
    const allCuisines = initialRestaurants.map(r => r.cuisine).filter(Boolean) as string[];
    return Array.from(new Set(allCuisines)).sort();
  }, [initialRestaurants]);

  const filteredRestaurants = useMemo(() => {
    return initialRestaurants
      .filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(restaurant =>
        cuisineFilter === 'all' || restaurant.cuisine === cuisineFilter
      )
      .filter(restaurant =>
        priceFilter === 'all' || restaurant.priceRange === priceFilter
      );
  }, [initialRestaurants, searchTerm, cuisineFilter, priceFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setCuisineFilter('all');
    setPriceFilter('all');
  };

  return (
    <PageLayout title="Restaurants">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">Restaurants entdecken</h1>
          <p className="text-lg text-gray-500">Finden Sie Ihren nächsten Lieblingsplatz zum Essen.</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md mb-8 sticky top-20 z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            <div className="relative lg:col-span-2">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Restaurant suchen..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <select
                value={cuisineFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCuisineFilter(e.target.value)}
                className="appearance-none w-full bg-white border border-gray-200 rounded-lg py-3 pl-4 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Alle Küchen</option>
                {cuisines.map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>

            <div className="relative">
              <select
                value={priceFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriceFilter(e.target.value)}
                className="appearance-none w-full bg-white border border-gray-200 rounded-lg py-3 pl-4 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {priceCategories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-500">
            <span>
              {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'Restaurant' : 'Restaurants'} gefunden
            </span>
            {(searchTerm || cuisineFilter !== 'all' || priceFilter !== 'all') && (
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

        {filteredRestaurants.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block bg-yellow-100 p-4 rounded-full">
              <FiSearch size={32} className="text-yellow-600" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-gray-800">Keine Restaurants gefunden</h3>
            <p className="mt-2 text-gray-500">Bitte passen Sie Ihre Suchkriterien an.</p>
          </div>
        )}

        {viewMode === 'map' && filteredRestaurants.length > 0 && (
          <div className="mb-12 rounded-xl overflow-hidden shadow-lg">
            <RestaurantMap restaurants={filteredRestaurants} height="600px" />
          </div>
        )}

        {viewMode === 'grid' && filteredRestaurants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {filteredRestaurants.map((restaurant) => (
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
  const { data: { session } } = await supabase.auth.getSession();

  try {
    const restaurantsData = await prisma.restaurant.findMany({
      where: { isActive: true },
      include: {
        ratings: { // Direkter Include der Ratings
          select: { value: true },
        },
      },
    });

    const restaurants: RestaurantPageItem[] = restaurantsData.map((restaurant) => {
      const ratingCount = restaurant.ratings.length;
      const avgRating = ratingCount > 0
        ? restaurant.ratings.reduce((acc, rating) => acc + rating.value, 0) / ratingCount
        : 0;

      const { postal_code, ...rest } = restaurant;

      return {
        ...rest,
        // Ensure all fields match the non-nullable RestaurantPageItem interface
        name: restaurant.name ?? 'Unbekanntes Restaurant',
        description: restaurant.description ?? 'Keine Beschreibung verfügbar.',
        address: restaurant.address ?? 'Keine Adresse',
        city: restaurant.city ?? 'Unbekannte Stadt',
        cuisine: restaurant.cuisine ?? 'Unbekannt',
        imageUrl: restaurant.imageUrl || '/images/logo.svg',
        capacity: restaurant.capacity ?? 0,
        offerTableToday: restaurant.offerTableToday ?? false,
        priceRange: restaurant.priceRange ?? 'N/A',
        // Map snake_case to camelCase and provide a default
        postalCode: postal_code ?? '',
        // Add calculated fields
        avgRating,
        totalRatings: ratingCount,
      };
    });

    return {
      props: {
        // Use JSON stringify/parse to prevent serialization errors with Date objects
        restaurants: JSON.parse(JSON.stringify(restaurants)),
        initialFilters: { ...context.query },
      },
    };
  } catch (error) {
    console.error('Error fetching restaurants in getServerSideProps:', error);
    // On error, return empty props to prevent the page from crashing
    return {
      props: {
        restaurants: [],
        initialFilters: { ...context.query },
        error: 'Fehler beim Laden der Restaurants.',
      },
    };
  }
};
