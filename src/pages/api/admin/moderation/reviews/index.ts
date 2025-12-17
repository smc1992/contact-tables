import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Supabase-Client erstellen
  const supabase = createClient({ req, res });
  
  // Authentifizierung prüfen
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  // Prüfen, ob der Benutzer ein Admin ist
  if (user.user_metadata?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Keine Berechtigung' });
  }
  
  try {
    // GET-Anfragen: Bewertungen abrufen
    if (req.method === 'GET') {
      const { 
        page = '1', 
        limit = '10', 
        status = 'all',
        restaurant = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);
      const skip = (pageNumber - 1) * limitNumber;
      
      // Supabase-Abfrage vorbereiten
      let query = supabase
        .from('reviews')
        .select(`
          *,
          user:user_id (*),
          restaurant:restaurant_id (*),
          reports:review_reports (*)
        `, { count: 'exact' });
      
      // Filter anwenden
      if (status !== 'all') {
        query = query.eq('status', status);
      }
      
      // Restaurant-Filter anwenden
      if (restaurant && typeof restaurant === 'string') {
        // Zuerst die Restaurant-IDs finden, die dem Namen entsprechen
        const { data: matchingRestaurants } = await supabase
          .from('restaurants')
          .select('id')
          .ilike('name', `%${restaurant}%`);
        
        if (matchingRestaurants && matchingRestaurants.length > 0) {
          const restaurantIds = matchingRestaurants.map(r => r.id);
          query = query.in('restaurant_id', restaurantIds);
        }
      }
      
      // Sortierung anwenden
      const supabaseSortBy = typeof sortBy === 'string' ? 
        (sortBy === 'createdAt' ? 'created_at' : sortBy) : 'created_at';
      query = query.order(supabaseSortBy, { ascending: sortOrder === 'asc' });
      
      // Paginierung anwenden
      query = query.range(skip, skip + limitNumber - 1);
      
      // Abfrage ausführen
      const { data: reviews, count: totalCount, error } = await query;
      
      if (error) {
        console.error('Fehler beim Abrufen der Bewertungen:', error);
        return res.status(500).json({ message: 'Fehler beim Abrufen der Bewertungen', error });
      }
      
      // Antwort senden
      return res.status(200).json({
        reviews,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          totalItems: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limitNumber)
        }
      });
    }
    
    // Andere Anfragemethoden nicht erlaubt
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Fehler bei der Bewertungsmoderation:', error);
    return res.status(500).json({ message: 'Interner Serverfehler', error });
  } finally {
    // Keine Verbindung zu schließen bei Supabase
  }
}
