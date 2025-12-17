import { NextApiRequest, NextApiResponse } from 'next';
import { withCache } from '@/utils/server-cache';
import { withRateLimit } from '@/utils/rate-limit';

// Mock-Daten für Restaurants
const mockRestaurants = [
  {
    id: 1,
    name: 'La Trattoria',
    description: 'Authentische italienische Küche im Herzen der Stadt',
    address: 'Hauptstraße 42, 10115 Berlin',
    category_id: 1,
    rating: 4.8,
    price_level: 2,
    is_featured: true,
    image_url: '/images/restaurants/italian1.jpg',
    created_at: '2023-05-15T10:30:00Z'
  },
  {
    id: 2,
    name: 'Sakura Sushi',
    description: 'Frisches Sushi und japanische Spezialitäten',
    address: 'Bergmannstraße 104, 10961 Berlin',
    category_id: 2,
    rating: 4.7,
    price_level: 3,
    is_featured: true,
    image_url: '/images/restaurants/japanese1.jpg',
    created_at: '2023-06-20T14:15:00Z'
  },
  {
    id: 3,
    name: 'Brauhaus am See',
    description: 'Deutsche Küche mit hausgebrauten Bieren',
    address: 'Seestraße 8, 13353 Berlin',
    category_id: 3,
    rating: 4.5,
    price_level: 2,
    is_featured: true,
    image_url: '/images/restaurants/german1.jpg',
    created_at: '2023-04-10T12:00:00Z'
  },
  {
    id: 4,
    name: 'Burger Palace',
    description: 'Premium Burger mit hausgemachten Saucen',
    address: 'Friedrichstraße 123, 10117 Berlin',
    category_id: 4,
    rating: 4.6,
    price_level: 2,
    is_featured: true,
    image_url: '/images/restaurants/burger1.jpg',
    created_at: '2023-07-05T18:45:00Z'
  },
  {
    id: 5,
    name: 'Casa Mexicana',
    description: 'Authentische mexikanische Küche mit hausgemachten Tortillas',
    address: 'Oranienstraße 56, 10969 Berlin',
    category_id: 5,
    rating: 4.4,
    price_level: 2,
    is_featured: true,
    image_url: '/images/restaurants/mexican1.jpg',
    created_at: '2023-03-25T19:30:00Z'
  },
  {
    id: 6,
    name: 'Taj Mahal',
    description: 'Indische Spezialitäten mit authentischen Gewürzen',
    address: 'Kantstraße 45, 10625 Berlin',
    category_id: 6,
    rating: 4.3,
    price_level: 2,
    is_featured: false,
    image_url: '/images/restaurants/indian1.jpg',
    created_at: '2023-02-18T16:20:00Z'
  },
  {
    id: 7,
    name: 'Green Garden',
    description: 'Vegetarische und vegane Gerichte aus regionalen Zutaten',
    address: 'Schönhauser Allee 123, 10437 Berlin',
    category_id: 7,
    rating: 4.7,
    price_level: 2,
    is_featured: false,
    image_url: '/images/restaurants/vegetarian1.jpg',
    created_at: '2023-08-10T11:15:00Z'
  },
  {
    id: 8,
    name: 'Vegan Delight',
    description: '100% pflanzliche Küche mit kreativen Gerichten',
    address: 'Kastanienallee 89, 10435 Berlin',
    category_id: 8,
    rating: 4.6,
    price_level: 3,
    is_featured: false,
    image_url: '/images/restaurants/vegan1.jpg',
    created_at: '2023-09-05T13:40:00Z'
  },
  {
    id: 9,
    name: 'Olive & Thyme',
    description: 'Mediterrane Küche mit frischen Kräutern und Olivenöl',
    address: 'Torstraße 72, 10119 Berlin',
    category_id: 9,
    rating: 4.5,
    price_level: 3,
    is_featured: false,
    image_url: '/images/restaurants/mediterranean1.jpg',
    created_at: '2023-01-30T17:50:00Z'
  },
  {
    id: 10,
    name: 'Le Bistro',
    description: 'Französische Küche mit ausgewählten Weinen',
    address: 'Unter den Linden 15, 10117 Berlin',
    category_id: 10,
    rating: 4.9,
    price_level: 4,
    is_featured: false,
    image_url: '/images/restaurants/french1.jpg',
    created_at: '2023-07-22T19:10:00Z'
  },
];

// Handler-Funktion für die API-Route
async function restaurantsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Pagination implementieren
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Simuliere eine kleine Verzögerung für realistischere Tests
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Slice der Restaurants basierend auf Pagination
    const paginatedRestaurants = mockRestaurants.slice(offset, offset + limit);
    
    const result = {
      restaurants: paginatedRestaurants,
      pagination: {
        total: mockRestaurants.length,
        page,
        limit,
        pages: Math.ceil(mockRestaurants.length / limit)
      }
    };
    
    return result;
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return { error: 'Internal server error' };
  }
}

// Kombiniere Cache und Rate-Limiting Middleware
// Wir wenden zuerst das Caching an und dann das Rate-Limiting
// Dies stellt sicher, dass gecachte Antworten nicht zum Rate-Limit zählen
const handlerWithCache = withCache(restaurantsHandler, {
  ttl: 30 * 1000, // 30 Sekunden Cache-Zeit
  staleWhileRevalidate: true
});

// Exportiere den Handler mit beiden Middlewares
export default withRateLimit(handlerWithCache, {
  limit: 100, // 100 Anfragen pro Minute erlaubt
  windowMs: 60 * 1000, // 1 Minute Zeitfenster
});
