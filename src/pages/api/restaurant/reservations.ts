import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { restaurantId } = req.query;
  if (!restaurantId || typeof restaurantId !== 'string') {
    return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
  }

  // Create a Supabase client with the request and response objects
  const supabase = createClient({ req, res });

  try {
    // Get the user from the session, which is implicitly read from the request cookies
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('API Auth Error:', userError?.message);
      return res.status(401).json({ message: 'Nicht autorisiert' });
    }

    // Verify the authenticated user owns the restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .eq('owner_id', user.id)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(403).json({ message: 'Keine Berechtigung für dieses Restaurant' });
    }

    // Fetch reservations for the specified restaurant
    const { data: reservations, error: reservationsError } = await supabase
      .from('contact_tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('datetime', { ascending: false });

    if (reservationsError) {
      console.error('Supabase error fetching reservations:', reservationsError);
      return res.status(500).json({ message: 'Fehler beim Abrufen der Reservierungen', error: reservationsError.message });
    }

    return res.status(200).json(reservations);

  } catch (error: any) {
    console.error('Server error fetching reservations:', error);
    return res.status(500).json({ message: 'Interner Serverfehler', error: error.message });
  }
}
