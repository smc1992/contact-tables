import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { PrivacySettings } from '@/types/settings';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: No user found.' });
  }

  if (user.user_metadata.role !== 'RESTAURANT') {
    return res.status(403).json({ error: 'Forbidden: User is not a restaurant owner.' });
  }

  const { settings } = req.body as { settings: PrivacySettings };

  if (!settings) {
    return res.status(400).json({ error: 'Bad Request: Missing settings in request body.' });
  }

  try {
    const updatedRestaurant = await prisma.restaurant.update({
      where: {
        userId: user.id,
      },
      data: {
        privacySettings: settings as unknown as Prisma.JsonObject,
      },
    });

    if (!updatedRestaurant) {
        return res.status(404).json({ error: 'Restaurant not found for this user.' });
    }

    return res.status(200).json({ message: 'Privacy settings updated successfully.' });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return res.status(500).json({ error: 'Internal Server Error: An unexpected error occurred.' });
  }
}
