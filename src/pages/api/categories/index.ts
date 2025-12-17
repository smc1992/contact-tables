import { NextApiRequest, NextApiResponse } from 'next';
import { withCache } from './server-cache';
import { withRateLimit } from './rate-limit';

// Mock-Daten für Kategorien
const mockCategories = [
  { id: 1, name: 'Italienisch', slug: 'italian', icon: 'pasta' },
  { id: 2, name: 'Japanisch', slug: 'japanese', icon: 'sushi' },
  { id: 3, name: 'Deutsch', slug: 'german', icon: 'beer' },
  { id: 4, name: 'Burger', slug: 'burger', icon: 'burger' },
  { id: 5, name: 'Mexikanisch', slug: 'mexican', icon: 'taco' },
  { id: 6, name: 'Indisch', slug: 'indian', icon: 'curry' },
  { id: 7, name: 'Vegetarisch', slug: 'vegetarian', icon: 'salad' },
  { id: 8, name: 'Vegan', slug: 'vegan', icon: 'leaf' },
  { id: 9, name: 'Mediterran', slug: 'mediterranean', icon: 'olive' },
  { id: 10, name: 'Französisch', slug: 'french', icon: 'wine' }
];

// Handler-Funktion für die API-Route
async function categoriesHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simuliere eine kleine Verzögerung für realistischere Tests
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return { categories: mockCategories };
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return { error: 'Internal server error' };
  }
}

// Wende zuerst das Caching an
const handlerWithCache = withCache(categoriesHandler, {
  ttl: 60 * 1000, // 60 Sekunden Cache-Zeit (Kategorien ändern sich selten)
  staleWhileRevalidate: true
});

// Exportiere den Handler mit beiden Middlewares
// Höheres Limit für Kategorien, da diese häufig abgerufen werden
export default withRateLimit(handlerWithCache, {
  limit: 200, // 200 Anfragen pro Minute erlaubt
  windowMs: 60 * 1000, // 1 Minute Zeitfenster
});
