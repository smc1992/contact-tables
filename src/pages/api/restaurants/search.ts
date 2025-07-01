import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Hilfsfunktion zur Distanzberechnung (Haversine-Formel)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Erdradius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Entfernung in km
  return distance;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Nur GET-Anfragen erlauben
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  console.log('[API /api/restaurants/search] Received query params:', JSON.stringify(req.query, null, 2));
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[DIAGNOSTIC LOG] SUPABASE_SERVICE_ROLE_KEY Check:');
    console.log(`  - Exists: ${!!serviceKey}`)
    console.log(`  - Type: ${typeof serviceKey}`)
    console.log(`  - Length: ${serviceKey?.length || 0}`)
    console.log(`  - Starts with: ${serviceKey?.substring(0, 5) || 'N/A'}`)
    console.log(`  - Ends with: ${serviceKey?.slice(-5) || 'N/A'}`);
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    const safeQueryParam = (param: string | string[] | undefined): string | undefined => {
      return Array.isArray(param) ? param[0] : param;
    };

    const latitude = safeQueryParam(req.query.latitude);
    const longitude = safeQueryParam(req.query.longitude);
    const radius = Number(safeQueryParam(req.query.radius) ?? '5000');
    const searchTerm = safeQueryParam(req.query.searchTerm) ?? '';
    const date = safeQueryParam(req.query.date);
    const time = safeQueryParam(req.query.time);
    const guests = safeQueryParam(req.query.guests);
    const cuisine = safeQueryParam(req.query.cuisine);
    const priceRange = safeQueryParam(req.query.priceRange);
    const offerTableToday = safeQueryParam(req.query.offerTableToday);
    const sortBy = safeQueryParam(req.query.sortBy) ?? 'distance';

    const hasLocation = latitude !== undefined && longitude !== undefined &&
                      latitude !== '' && longitude !== '' &&
                      !isNaN(Number(latitude)) && !isNaN(Number(longitude));
    const hasSearchTerm = searchTerm !== undefined && searchTerm !== '';

    if (!hasLocation && !hasSearchTerm) {
      return res.status(400).json({
        message: 'Entweder Standort (Breitengrad und Längengrad) oder Suchbegriff ist erforderlich'
      });
    }

    let query = supabase
      .from('restaurants')
      .select(`
        id, name, description, address, city, postal_code, latitude, longitude, cuisine, price_range, website, opening_hours, offer_table_today, phone, email
      `)
      .eq('is_active', true)
      .eq('contract_status', 'ACTIVE');

    if (searchTerm) {
      // Temporär vereinfacht, um Fehler in der .or-Klausel zu vermeiden
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

    const { data: restaurantsData, error } = await query;

    if (error) {
      console.error('Fehler bei der Suche nach Restaurants (Supabase error object):', JSON.stringify(error, null, 2));
      return res.status(500).json({
        message: 'Datenbankfehler',
        errorDetails: process.env.NODE_ENV === 'development' ? error : { message: error.message, code: error.code, details: error.details, hint: error.hint }
      });
    }

    if (!restaurantsData || restaurantsData.length === 0) {
      const demoRestaurants = [
        {
          id: 'demo1',
          name: 'Restaurant Bella Italia',
          description: 'Authentische italienische Küche in gemütlicher Atmosphäre.',
          address: 'Hauptstraße 123',
          city: 'Berlin',
          postal_code: '10115',
          latitude: 52.5200,
          longitude: 13.4050,
          cuisine: 'Italienisch',
          price_range: '€€',
          image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cmVzdGF1cmFudHxlbnwwfHwwfHw%3D&w=1000&q=80',
          contact_email: 'info@bella-italia.de',
          contact_phone: '+49 30 12345678',
          website: 'https://www.bella-italia.de',
          opening_hours: 'Mo-Fr: 11:00-23:00, Sa-So: 12:00-00:00',
          offer_table_today: true,
          
          avgRating: 4.3, // Demo rating
          distance: hasLocation ? calculateDistance(Number(latitude), Number(longitude), 52.5200, 13.4050) : null,
          user: null // User data removed
        },
        {
          id: 'demo2',
          name: 'Sushi Palace',
          description: 'Frisches Sushi und japanische Spezialitäten.',
          address: 'Friedrichstraße 45',
          city: 'Berlin',
          postal_code: '10117',
          latitude: 52.5180,
          longitude: 13.3880,
          cuisine: 'Japanisch',
          price_range: '€€€',
          image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8c3VzaGl8ZW58MHx8MHx8&w=1000&q=80',
          contact_email: 'info@sushi-palace.de',
          contact_phone: '+49 30 87654321',
          website: 'https://www.sushi-palace.de',
          opening_hours: 'Mo-So: 12:00-22:00',
          offer_table_today: true,
          
          avgRating: 4.8, // Demo rating
          distance: hasLocation ? calculateDistance(Number(latitude), Number(longitude), 52.5180, 13.3880) : null,
          user: null // User data removed
        }
      ];
      return res.status(200).json({
        restaurants: demoRestaurants,
        pagination: {
          totalResults: demoRestaurants.length,
          totalPages: 1,
          currentPage: 1,
          resultsPerPage: demoRestaurants.length
        },
        filters: {
          searchTerm: searchTerm || null, date: date || null, time: time || null, guests: guests || null, cuisine: cuisine || null, priceRange: priceRange || null, offerTableToday: offerTableToday === 'true' || false, sortBy
        },
        message: 'Demo-Restaurants zurückgegeben.'
      });
    }

    const processedRestaurants = restaurantsData.map(restaurant => {
      let distance = null;
      if (hasLocation && restaurant.latitude && restaurant.longitude) {
        distance = calculateDistance(
          Number(latitude),
          Number(longitude),
          restaurant.latitude,
          restaurant.longitude
        );
      }
      return {
        ...restaurant,
        avgRating: null, // Ratings data removed, so no avgRating
        distance,
        user: null // User data removed
      };
    });

    let sortedRestaurants = [...processedRestaurants];
    
    if (sortBy === 'distance' && hasLocation) {
      sortedRestaurants.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else if (sortBy === 'popularity') {
      // Placeholder for popularity sort, e.g., by number of events
      // sortedRestaurants.sort((a, b) => (b.events?.length || 0) - (a.events?.length || 0));
    }
    // Sort by rating is removed as ratings are not fetched

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedRestaurants = sortedRestaurants.slice(startIndex, endIndex);

    res.status(200).json({
      restaurants: paginatedRestaurants,
      pagination: {
        totalResults: sortedRestaurants.length,
        totalPages: Math.ceil(sortedRestaurants.length / limit),
        currentPage: page,
        resultsPerPage: limit
      },
      filters: {
        searchTerm: searchTerm || null, date: date || null, time: time || null, guests: guests || null, cuisine: cuisine || null, priceRange: priceRange || null, offerTableToday: offerTableToday === 'true' || false, sortBy
      }
    });

  } catch (e: any) {
    console.error('Unerwarteter Fehler in /api/restaurants/search:', e);
    res.status(500).json({
      message: 'Interner Serverfehler',
      error: {
        message: e.message,
        stack: e.stack,
        details: e.details,
        code: e.code
      }
    });
  }
}
