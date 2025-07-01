import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies[name],
        set: (name: string, value: string, options: CookieOptions) => {},
        remove: (name: string, options: CookieOptions) => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const { restaurantId } = req.query;

  if (!restaurantId || typeof restaurantId !== 'string') {
    return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
  }

  try {
    // Verify user owns the restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .eq('userId', user.id)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(403).json({ message: 'Keine Berechtigung für dieses Restaurant' });
    }

    // Fetch reservations
    const { data: reservations, error: reservationsError } = await supabase
      .from('contact_tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('date', { ascending: false });

    if (reservationsError) {
      throw reservationsError;
    }

    return res.status(200).json(reservations);
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Reservierungen:', error);
    return res.status(500).json({ message: error.message || 'Interner Serverfehler' });
  }
}
