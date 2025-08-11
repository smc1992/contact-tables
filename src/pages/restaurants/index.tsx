import { FC, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/server';
import PageLayout from '@/components/PageLayout';
import RestaurantCard from '@/components/RestaurantCard';
import { RestaurantPageItem } from '../../types/restaurants';

const RestaurantMap = dynamic(
  () => import('@/components/RestaurantMap'),
  { 
    ssr: false,
    loading: () => <div className="h-[600px] w-full bg-gray-200 flex items-center justify-center rounded-xl"><p>Karte wird geladen...</p></div>
  }
);


// Props for the entire page
interface RestaurantsPageProps {
  restaurants: RestaurantPageItem[];
  searchQuery: string | null;
  location: string | null;
  radius: number;
  center: { lat: number; lng: number } | null;
  error?: string;
}

const RestaurantsPage: FC<RestaurantsPageProps> = ({ restaurants, searchQuery, location, radius, center, error }) => {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [locationState, setLocation] = useState(location || '');
  const [radiusState, setRadius] = useState(radius.toString());
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query: { [key: string]: string } = {};

    if (searchTerm) query.search = searchTerm;
    if (locationState) query.location = locationState;
    if (locationState && radiusState) query.radius = radiusState;

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
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md mb-12 border border-gray-100">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            {/* Search by Name */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Restaurantname</label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="z.B. Bella Italia"
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
              />
            </div>

            {/* Search by Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Ort oder PLZ</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9 7 7 0 01-9.9-9.9zM10 11a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                </span>
                <input
                  id="location"
                  type="text"
                  value={locationState}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="z.B. Berlin oder 10115"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Radius Select */}
            <div>
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">Umkreis</label>
              <select
                id="radius"
                value={radiusState}
                onChange={(e) => setRadius(e.target.value)}
                disabled={!locationState}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                className="w-full md:w-auto bg-primary-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-primary-600 transition-colors duration-300 shadow-sm"
              >
                Suchen
              </button>
            </div>
          </form>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <div className="flex justify-between items-center mb-8">
          <div className="text-lg text-gray-600">
            <span>
              {restaurants.length} {restaurants.length === 1 ? 'Restaurant' : 'Restaurants'} gefunden
            </span>
            {(searchQuery || location) && (
              <button
                onClick={resetFilters}
                className="ml-4 text-primary-500 hover:text-primary-700 text-sm font-medium"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${viewMode === 'grid' ? 'bg-white text-primary-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${viewMode === 'map' ? 'bg-white text-primary-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Karte
            </button>
          </div>
        </div>

        {viewMode === 'map' && (
          <div className="mb-12 rounded-xl overflow-hidden shadow-lg">
            <RestaurantMap restaurants={restaurants} height="600px" center={center} />
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}

        {restaurants.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-700">Keine Ergebnisse</h3>
              <p className="text-gray-500 mt-2">Für Ihre Suche wurden keine Restaurants gefunden.</p>
            </div>
        )}

      </div>
    </PageLayout>
  );
};

export const getServerSideProps: GetServerSideProps<RestaurantsPageProps> = async (context) => {
  const supabase = createClient(context);
  const searchQuery = (context.query.search as string) || null;
  const location = (context.query.location as string) || null;
  const radius = parseInt((context.query.radius as string) || '25', 10);
  
  let restaurantsData: any[] = [];
  let geoData: { lat: number; lon: number } | null = null;

  const defaultProps = {
    restaurants: [],
    searchQuery,
    location,
    radius,
    center: null,
  };

  try {
    if (location) {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
      if (!geoRes.ok) throw new Error('Geocoding service failed.');
      const geoResults = await geoRes.json();
      if (geoResults.length === 0) {
        return { props: { ...defaultProps, error: 'Ort nicht gefunden.' } };
      }
      geoData = geoResults[0];

      if (geoData) {
        const { data, error } = await supabase.rpc('nearby_restaurants', {
          lat: geoData.lat,
          long: geoData.lon,
          radius_meters: radius * 1000, // km to meters
        });

        if (error) throw error;
        restaurantsData = data || [];
      }

    } else if (searchQuery) {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*, ratings(value)')
        .textSearch('name', `'${searchQuery}'`);
      
      if (error) throw error;
      restaurantsData = data || [];

    } else {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*, ratings(value)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      restaurantsData = data || [];
    }

    const restaurants: RestaurantPageItem[] = restaurantsData.map((r: any) => ({
      id: r.id,
      name: r.name ?? 'Unbekanntes Restaurant',
      description: r.description ?? 'Keine Beschreibung verfügbar.',
      address: r.address ?? 'Keine Adresse',
      city: r.city ?? 'Unbekannte Stadt',
      postalCode: r.postal_code ?? r.postalCode ?? '',
      cuisine: r.cuisine ?? 'Unbekannt',
      imageUrl: r.image_url ?? r.imageUrl ?? '/images/placeholder-restaurant.webp',
      capacity: r.capacity ?? 0,
      offerTableToday: r.offer_table_today ?? r.offerTableToday ?? false,
      priceRange: r.price_range ?? r.priceRange ?? 'N/A',
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      avgRating: r.avg_rating ?? (r.ratings ? r.ratings.reduce((acc: number, rating: { value: number }) => acc + rating.value, 0) / r.ratings.length : 0),
      totalRatings: r.popularity ?? (r.ratings ? r.ratings.length : 0),
    }));

    return { 
      props: { 
        ...defaultProps,
        restaurants, 
        center: geoData ? { lat: geoData.lat, lng: geoData.lon } : null
      } 
    };

  } catch (error: any) {
    console.error('Error fetching restaurants:', error);
    return { 
      props: { 
        ...defaultProps,
        error: 'Ein unerwarteter Fehler ist aufgetreten.' 
      } 
    };
  }
};

export default RestaurantsPage;
