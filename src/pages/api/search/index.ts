import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { withCache } from './server-cache';
import { withRateLimit } from './rate-limit';

// Handler-Funktion für die API-Route
async function searchHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient({ req, res });
    const query = req.query.query as string;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Suche nach Restaurants, die dem Suchbegriff entsprechen
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error searching restaurants:', error);
      return res.status(500).json({ error: 'Failed to search restaurants' });
    }
    
    return res.status(200).json({ restaurants });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Wende zuerst das Caching an
const handlerWithCache = withCache(searchHandler, {
  ttl: 60 * 1000, // 1 Minute Cache-Zeit
  staleWhileRevalidate: true
});

// Exportiere den Handler mit beiden Middlewares
// Strengeres Limit für Suchanfragen, da diese rechenintensiver sind
export default withRateLimit(handlerWithCache, {
  limit: 60, // 60 Anfragen pro Minute erlaubt (1 pro Sekunde)
  windowMs: 60 * 1000, // 1 Minute Zeitfenster
});
