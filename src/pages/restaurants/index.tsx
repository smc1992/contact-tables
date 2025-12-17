import { FC, useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/server';
import PageLayout from '@/components/PageLayout';
import RestaurantCard from '@/components/RestaurantCard';
import ContactTablesList from '@/components/ContactTablesList';
import { RestaurantPageItem } from '../../types/restaurants';
import { type Database } from '../../types/supabase';
import { User } from '@supabase/supabase-js';

type ContactTable = Database['public']['Tables']['contact_tables']['Row'];
type Restaurant = Database['public']['Tables']['restaurants']['Row'];

type ContactTableWithRestaurant = ContactTable & {
  restaurant: Restaurant | null;
};

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
  contactTables: ContactTableWithRestaurant[];
  userRole: string;
  searchQuery: string | null;
  location: string | null;
  radius: number;
  center: { lat: number; lng: number } | null;
  error?: string;
}

const RestaurantsPage: FC<RestaurantsPageProps> = ({ restaurants, contactTables, userRole, searchQuery, location, radius, center, error }) => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'restaurants' | 'contact-tables'>('restaurants');
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [locationState, setLocation] = useState(location || '');
  // Robust gegen fehlende oder nicht geladene Props: fallback auf 25 km
  const [radiusState, setRadius] = useState((radius ?? 25).toString());
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Contact Tables Filters
  const [ctFilters, setCtFilters] = useState({
    date: '',
    interests: '',
  });
  const [filteredContactTables, setFilteredContactTables] = useState(contactTables || []);

  useEffect(() => {
    if (activeTab === 'contact-tables') {
      let tables = contactTables || [];

      // Filter by Global Location (client-side approximation)
      if (locationState) {
        tables = tables.filter(table => 
          table.restaurant?.city?.toLowerCase().includes(locationState.toLowerCase()) ||
          table.restaurant?.postal_code?.includes(locationState)
        );
      }

      // Filter by Date
      if (ctFilters.date) {
        const selectedDate = new Date(ctFilters.date);
        tables = tables.filter((table) => {
          if ((table as any).is_indefinite === true) return true;
          if (!table.datetime) return false;
          const tableDate = new Date(table.datetime);
          return tableDate.toLocaleDateString('de-DE') === selectedDate.toLocaleDateString('de-DE');
        });
      }

      // Filter by Interests
      if (ctFilters.interests) {
        const searchKeywords = ctFilters.interests.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
        if (searchKeywords.length > 0) {
          tables = tables.filter(table => 
            searchKeywords.some(keyword => 
              table.title.toLowerCase().includes(keyword) ||
              (table.description && table.description.toLowerCase().includes(keyword))
            )
          );
        }
      }

      setFilteredContactTables(tables);
    }
  }, [contactTables, locationState, ctFilters, activeTab]);

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
    setCtFilters({ date: '', interests: '' });
    router.push('/restaurants');
  };

  const handleCtFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCtFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <PageLayout title="Restaurants & Kontakttische">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Global Search Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md mb-8 border border-gray-100">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            {/* Search by Name */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === 'restaurants' ? 'Restaurantname' : 'Suche'} <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'restaurants' ? "z.B. Bella Italia" : "Suche..."}
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

        {/* Content based on Tab */}
          <>
            <div className="flex justify-between items-center mb-8">
              <div className="text-lg text-gray-600">
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
                  <h3 className="text-xl font-semibold text-gray-700">Keine Restaurants gefunden</h3>
                  <p className="text-gray-500 mt-2">Versuche es mit einer anderen Suche.</p>
                </div>
            )}
          </>

      </div>
    </PageLayout>
  );
};

export const getServerSideProps: GetServerSideProps<RestaurantsPageProps> = async (context) => {
  const supabase = createClient(context);
  const searchQuery = (context.query.search as string) || null;
  const location = (context.query.location as string) || null;
  const radius = parseInt((context.query.radius as string) || '25', 10);
  
  // Get User Role for Contact Tables
  const { data: { user } } = await supabase.auth.getUser();
  const userRole = user?.user_metadata?.role || 'CUSTOMER';

  // Fetch Contact Tables
  const { data: contactTablesData } = await supabase
    .from('contact_tables')
    .select('*, restaurant:restaurant_id(*)')
    .eq('is_public', true)
    .order('datetime', { ascending: true });

  const contactTables = (contactTablesData || []) as ContactTableWithRestaurant[];

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
      // Geokodierung mit Nominatim inkl. erforderlicher Header
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'ContactTables/1.0 (+https://example.local)',
            'Accept-Language': 'de',
            'Referer': 'https://example.local/restaurants',
          },
        }
      );

      if (geoRes.ok) {
        const geoResults = await geoRes.json();
        if (Array.isArray(geoResults) && geoResults.length > 0) {
          geoData = geoResults[0];
        }
      }

      if (geoData) {
        const { data, error } = await supabase.rpc('nearby_restaurants', {
          lat: Number((geoData as any).lat),
          long: Number((geoData as any).lon),
          radius_meters: radius * 1000, // km zu m
        });

        if (error) {
          // Robuster Fallback: Textbasierte Suche, wenn RPC scheitert (z. B. RLS)
          console.error('nearby_restaurants RPC Fehler, Fallback auf Textsuche:', error);
          let query = supabase
            .from('visible_restaurants')
            .select('*')
            .or(`city.ilike.%${location}%,postal_code.ilike.%${location}%`);

          // Optionale Filter anwenden, falls vorhanden
          if (context.query.cuisine) {
            query = query.ilike('cuisine', `%${context.query.cuisine}%`);
          }
          if (context.query.priceRange) {
            query = query.eq('price_range', context.query.priceRange);
          }
          if (context.query.offerTableToday === 'true') {
            query = query.eq('offer_table_today', true);
          }

          const { data: dataFallback, error: errorFallback } = await query;

          if (errorFallback && (errorFallback.message?.includes('visible_restaurants') || (errorFallback as any).code === '42P01')) {
            const { data: data2, error: error2 } = await supabase
              .from('restaurants')
              .select('*')
              .eq('is_active', true)
              .eq('is_visible', true)
              .eq('contract_status', 'ACTIVE')
              .or(`city.ilike.%${location}%,postal_code.ilike.%${location}%`);

            if (error2) throw error2;
            restaurantsData = data2 || [];
          } else if (errorFallback) {
            throw errorFallback;
          } else {
            restaurantsData = dataFallback || [];
          }

        } else {
          restaurantsData = data || [];
          // Sichtbarkeit erzwingen: nur aktive & bezahlte Restaurants
          restaurantsData = (restaurantsData || []).filter((r: any) => r?.is_active === true && r?.contract_status === 'ACTIVE');
        }
      } else {
        // Fallback: Standort als Stadt/PLZ-Textsuche
        let query = supabase
          .from('visible_restaurants')
          .select('*')
          .or(`city.ilike.%${location}%,postal_code.ilike.%${location}%`);

        const { data, error } = await query;

        if (error && (error.message?.includes('visible_restaurants') || (error as any).code === '42P01')) {
          const { data: data2, error: error2 } = await supabase
            .from('restaurants')
            .select('*')
            .eq('is_active', true)
            .eq('is_visible', true)
            .eq('contract_status', 'ACTIVE')
            .or(`city.ilike.%${location}%,postal_code.ilike.%${location}%`);
          if (error2) throw error2;
          restaurantsData = data2 || [];
        } else if (error) {
          throw error;
        } else {
          restaurantsData = data || [];
        }
      }

    } else if (searchQuery) {
      let query = supabase
        .from('visible_restaurants')
        .select('*')
        .ilike('name', `%${searchQuery}%`);
      
      if (context.query.cuisine) {
        query = query.ilike('cuisine', `%${context.query.cuisine}%`);
      }
      if (context.query.priceRange) {
        query = query.eq('price_range', context.query.priceRange);
      }
      if (context.query.offerTableToday === 'true') {
        query = query.eq('offer_table_today', true);
      }
      
      const { data, error } = await query;
      if (error && (error.message?.includes('visible_restaurants') || (error as any).code === '42P01')) {
        const { data: data2, error: error2 } = await supabase
          .from('restaurants')
          .select('*')
          .eq('is_active', true)
          .eq('is_visible', true)
          .eq('contract_status', 'ACTIVE')
          .ilike('name', `%${searchQuery}%`);
        if (error2) throw error2;
        restaurantsData = data2 || [];
      } else if (error) {
        throw error;
      } else {
        restaurantsData = data || [];
      }
    } else {
      const { data, error } = await supabase
        .from('visible_restaurants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error && (error.message?.includes('visible_restaurants') || (error as any).code === '42P01')) {
        const { data: data2, error: error2 } = await supabase
          .from('restaurants')
          .select('*')
          .eq('is_active', true)
          .eq('is_visible', true)
          .eq('contract_status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .limit(20);
        if (error2) throw error2;
        restaurantsData = data2 || [];
      } else if (error) {
        throw error;
      } else {
        restaurantsData = data || [];
      }
    }

    const restaurants: RestaurantPageItem[] = (restaurantsData || []).map((r: any) => ({
      id: r.id,
      slug: r.slug ?? null,
      name: r.name ?? null,
      description: r.description ?? null,
      address: r.address ?? null,
      city: r.city ?? null,
      avg_rating: r.avg_rating != null ? Number(r.avg_rating) : null,
      total_ratings: r.total_ratings != null ? Number(r.total_ratings) : null,
      cuisine: r.cuisine ?? null,
      image_url: r.image_url ?? null,
      capacity: r.capacity != null ? Number(r.capacity) : null,
      offer_table_today: r.offer_table_today ?? null,
      price_range: r.price_range ?? null,
      latitude: r.latitude != null ? Number(r.latitude) : (r.lat != null ? Number(r.lat) : null),
      longitude: r.longitude != null ? Number(r.longitude) : (r.long != null ? Number(r.long) : (r.lng != null ? Number(r.lng) : null)),
      distance_in_meters: r.distance_in_meters != null ? Number(r.distance_in_meters) : (r.distance_meters != null ? Number(r.distance_meters) : null),
      popularity: r.popularity ?? null,
      postal_code: r.postal_code ?? null,
    }));

    // Fallback-Geokodierung: fehlende Koordinaten per Nominatim ergänzen (sanft, begrenzt)
    // Hinweis: Nominatim hat Nutzungsrichtlinien; hier nur für wenige Einträge anwenden
    const toGeocode = restaurants.filter(r => (!r.latitude || !r.longitude) && (r.address || r.city)).slice(0, 10);
    for (const r of toGeocode) {
      try {
        const queryAddress = [r.address, r.postal_code, r.city].filter(Boolean).join(', ');
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryAddress)}&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'ContactTables/1.0 (+https://example.local)',
              'Accept-Language': 'de',
              'Referer': 'https://example.local/restaurants',
            },
          }
        );
        if (geoRes.ok) {
          const results = await geoRes.json();
          if (Array.isArray(results) && results.length > 0) {
            r.latitude = Number(results[0].lat);
            r.longitude = Number(results[0].lon);
          }
        }
      } catch (e) {
        // still fine; Map zeigt dann nur Einträge mit Koordinaten
        console.warn('Nominatim Geocoding Fehler:', e);
      }
    }

    return {
      props: {
        restaurants,
        contactTables,
        userRole,
        searchQuery,
        location,
        radius,
        center: geoData ? { lat: Number(geoData.lat), lng: Number(geoData.lon) } : null,
      }
    };
  } catch (err) {
    console.error('Fehler auf /restaurants:', err);
    return { props: { ...defaultProps, contactTables: [], userRole: 'CUSTOMER', error: 'Ein unerwarteter Fehler ist aufgetreten.' } };
  }
};

export default RestaurantsPage;
