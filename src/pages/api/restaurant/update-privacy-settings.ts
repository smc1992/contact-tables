import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { PrivacySettings } from '@/types/settings'; // Importiere den korrekten Typ

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const supabase = createPagesServerClient({ req, res });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized: No user found or error fetching user', details: userError?.message });
  }

  // Rollenprüfung
  let userRole = null;
  if (user && user.user_metadata) {
    if (user.user_metadata.data && typeof user.user_metadata.data.role === 'string') {
      userRole = user.user_metadata.data.role;
    } else if (typeof user.user_metadata.role === 'string') {
      userRole = user.user_metadata.role;
    }
  }

  if (userRole !== 'RESTAURANT') {
    return res.status(403).json({ error: 'Forbidden: User is not a restaurant owner.' });
  }

  const { settings } = req.body as { settings: PrivacySettings };

  if (!settings) {
    return res.status(400).json({ error: 'Bad Request: Missing settings in request body.' });
  }

  // Hier könnte eine detailliertere Validierung der 'settings'-Struktur erfolgen

  try {
    const { data: restaurant, error: restaurantFetchError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('userId', user.id)
      .single();

    if (restaurantFetchError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant not found for this user.', details: restaurantFetchError?.message });
    }

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ privacy_settings: settings }) // Speichere das 'settings'-Objekt direkt
      .eq('id', restaurant.id);

    if (updateError) {
      console.error('Error updating privacy settings:', updateError);
      return res.status(500).json({ error: 'Failed to update privacy settings.', details: updateError.message });
    }

    return res.status(200).json({ message: 'Privacy settings updated successfully.', settings });
  } catch (error: any) {
    console.error('Unexpected error in update-privacy-settings:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
