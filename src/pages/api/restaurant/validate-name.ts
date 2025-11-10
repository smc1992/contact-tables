import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = createClient({ req, res });
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const { restaurantId, name } = req.body || {};
  if (!restaurantId || typeof restaurantId !== 'string' || !name || typeof name !== 'string') {
    return res.status(400).json({ message: 'restaurantId und name sind erforderlich' });
  }

  try {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('id', restaurantId)
      .single();

    if (error || !restaurant) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    const valid = restaurant.name.trim() === name.trim();
    return res.status(200).json({ valid });
  } catch (e) {
    console.error('Fehler bei der Namensvalidierung:', e);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}