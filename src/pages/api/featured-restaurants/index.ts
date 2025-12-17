import { NextApiRequest, NextApiResponse } from 'next';
import { withCache } from './server-cache';
import { withRateLimit } from './rate-limit';

// Mock-Daten für hervorgehobene Restaurants
const mockFeaturedRestaurants = [
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
    created_at: '2023-05-15T10:30:00Z',
    featured_text: 'Unser Tipp für authentische italienische Küche',
    featured_until: '2025-12-31T23:59:59Z'
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
    created_at: '2023-06-20T14:15:00Z',
    featured_text: 'Premium Sushi-Erlebnis mit frischen Zutaten',
    featured_until: '2025-12-31T23:59:59Z'
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
    created_at: '2023-04-10T12:00:00Z',
    featured_text: 'Traditionelle deutsche Küche in gemütlicher Atmosphäre',
    featured_until: '2025-12-31T23:59:59Z'
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
    created_at: '2023-07-05T18:45:00Z',
    featured_text: 'Die saftigsten Burger der Stadt mit Zutaten aus der Region',
    featured_until: '2025-12-31T23:59:59Z'
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
    created_at: '2023-03-25T19:30:00Z',
    featured_text: 'Mexikanische Spezialitäten mit original Rezepten',
    featured_until: '2025-12-31T23:59:59Z'
  }
];

// Handler-Funktion für die API-Route
async function featuredRestaurantsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simuliere eine kleine Verzögerung für realistischere Tests
    await new Promise(resolve => setTimeout(resolve, 15));
    
    return { featured_restaurants: mockFeaturedRestaurants };
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return { error: 'Internal server error' };
  }
}

// Wende zuerst das Caching an
const handlerWithCache = withCache(featuredRestaurantsHandler, {
  ttl: 5 * 60 * 1000, // 5 Minuten Cache-Zeit
  staleWhileRevalidate: true
});

// Exportiere den Handler mit beiden Middlewares
// Moderates Limit für Featured-Restaurants, da diese auf der Startseite angezeigt werden
export default withRateLimit(handlerWithCache, {
  limit: 150, // 150 Anfragen pro Minute erlaubt
  windowMs: 60 * 1000, // 1 Minute Zeitfenster
});
