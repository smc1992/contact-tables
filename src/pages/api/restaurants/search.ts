import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../utils/supabase/server';
import { RestaurantPageItem } from '../../../types/restaurants';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  console.log('[API /api/restaurants/search] Received query params:', JSON.stringify(req.query, null, 2));

  try {
    const supabase = createClient({ req, res });

    const safeQueryParam = (param: string | string[] | undefined): string | undefined => {
      return Array.isArray(param) ? param[0] : param;
    };

    const latitude = safeQueryParam(req.query.latitude);
    const longitude = safeQueryParam(req.query.longitude);
    const radius = Number(safeQueryParam(req.query.radius) ?? '5000');
    const searchTerm = safeQueryParam(req.query.searchTerm) ?? '';
    const cuisine = safeQueryParam(req.query.cuisine);
    const priceRange = safeQueryParam(req.query.priceRange);
    const offerTableToday = safeQueryParam(req.query.offerTableToday);
    const sortBy = safeQueryParam(req.query.sortBy) ?? 'distance';

    const hasLocation = latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude));

    let restaurants = [];

    if (hasLocation) {
      // --- LOCATION-BASED SEARCH (FAST) ---
      const { data: rpcData, error: rpcError } = await supabase.rpc('nearby_restaurants', {
        lat: Number(latitude),
        long: Number(longitude),
        radius_meters: radius,
      });

      if (rpcError) {
        // Fallback: Wenn die RPC fehlschlägt (z.B. wegen RLS/Permission),
        // versuche eine Text-basierte Suche auf der Sicht "visible_restaurants".
        console.error('Fehler bei RPC nearby_restaurants, weiche auf Textsuche aus:', JSON.stringify(rpcError, null, 2));

        let query = supabase
          .from('visible_restaurants')
          .select('*, ratings(value), favorites(user_id)');

        if (searchTerm) {
          query = query.ilike('name', `%${searchTerm}%`);
        }
        if (cuisine) {
          query = query.ilike('cuisine', `%${cuisine}%`);
        }
        if (priceRange) {
          query = query.eq('price_range', priceRange);
        }
        if (offerTableToday === 'true') {
          query = query.eq('offer_table_today', true);
        }

        const { data: textSearchData, error: textSearchError } = await query;
        if (textSearchError) {
          console.error('Fehler bei Fallback-Textsuche:', JSON.stringify(textSearchError, null, 2));
          throw textSearchError;
        }

        restaurants = (textSearchData || []).map(restaurant => {
          const ratings = (restaurant.ratings as unknown as { value: number }[]) || [];
          const avgRating = ratings.length > 0 ? ratings.reduce((acc, r) => acc + r.value, 0) / ratings.length : null;
          const popularity = ((restaurant.favorites as unknown as any[]) || []).length;
          const { ratings: _ratings, favorites: _favorites, ...rest } = restaurant;
          return {
            ...rest,
            avg_rating: avgRating,
            popularity,
            distance_in_meters: null,
          } as any;
        });
      } else {
        // Enforce visibility gating: only active + paid (Digistore active)
        restaurants = (rpcData || []).filter((r: any) => r?.is_active === true && r?.contract_status === 'ACTIVE');

        // Additional filtering in backend if needed (less performant but necessary if not in RPC)
        if (cuisine) {
          restaurants = restaurants.filter((r: RestaurantPageItem) => r.cuisine?.toLowerCase().includes((cuisine as string).toLowerCase()));
        }
        if (priceRange) {
          restaurants = restaurants.filter((r: RestaurantPageItem) => r.price_range == priceRange);
        }
        if (offerTableToday === 'true') {
          restaurants = restaurants.filter((r: RestaurantPageItem) => r.offer_table_today === true);
        }
      }

    } else if (searchTerm) {
      // --- TEXT-BASED SEARCH (FALLBACK) ---
      let query = supabase
        .from('visible_restaurants')
        .select('*, ratings(value), favorites(user_id)')
        .ilike('name', `%${searchTerm}%`);

      if (cuisine) {
        query = query.ilike('cuisine', `%${cuisine}%`);
      }
      if (priceRange) {
        query = query.eq('price_range', priceRange);
      }
      if (offerTableToday === 'true') {
        query = query.eq('offer_table_today', true);
      }

      const { data: textSearchData, error: textSearchError } = await query;

      if (textSearchError) {
        console.error('Fehler bei Text-basierter Restaurantsuche:', JSON.stringify(textSearchError, null, 2));
        throw textSearchError;
      }
      
      // Process data to match the structure of the RPC call for consistency
      restaurants = (textSearchData || []).map(restaurant => {
          const ratings = (restaurant.ratings as unknown as { value: number }[]) || [];
          const avgRating = ratings.length > 0 ? ratings.reduce((acc, r) => acc + r.value, 0) / ratings.length : null;
          const popularity = ((restaurant.favorites as unknown as any[]) || []).length;
          const { ratings: _ratings, favorites: _favorites, ...rest } = restaurant;
          return {
              ...rest,
              avg_rating: avgRating,
              popularity,
              distance_meters: null, // No distance for text search
          };
      });

    } else {
      return res.status(400).json({ message: 'Ein Suchbegriff oder ein Standort ist erforderlich.' });
    }

    // --- SORTING ---
    if (sortBy === 'distance' && hasLocation) {
      restaurants.sort((a: RestaurantPageItem, b: RestaurantPageItem) => (a.distance_in_meters ?? Infinity) - (b.distance_in_meters ?? Infinity));
    } else if (sortBy === 'popularity') {
      restaurants.sort((a: RestaurantPageItem, b: RestaurantPageItem) => (b.popularity ?? 0) - (a.popularity ?? 0));
    } else if (sortBy === 'rating') {
      restaurants.sort((a: RestaurantPageItem, b: RestaurantPageItem) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
    }

    // --- PAGINATION ---
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedRestaurants = (restaurants as RestaurantPageItem[]).slice(startIndex, endIndex);

    res.status(200).json({
      restaurants: paginatedRestaurants,
      pagination: {
        totalResults: (restaurants as RestaurantPageItem[]).length,
        totalPages: Math.ceil((restaurants as RestaurantPageItem[]).length / limit),
        currentPage: page,
        resultsPerPage: limit
      },
      filters: { ...req.query }
    });
  } catch (error) {
    console.error('Fehler bei der Restaurantsuche:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
