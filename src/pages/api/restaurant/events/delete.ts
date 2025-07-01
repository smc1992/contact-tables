import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata.role !== 'RESTAURANT') {
    return res.status(403).json({ message: 'Forbidden: User is not authenticated or not a restaurant owner.' });
  }

  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ message: 'Event ID is required.' });
  }

  try {
    // First, verify the user owns the restaurant associated with the event
    const restaurant = await prisma.restaurant.findUnique({
        where: { userId: user.id },
        select: { id: true },
    });

    if (!restaurant) {
        return res.status(403).json({ message: 'Forbidden: No restaurant associated with this user.' });
    }

    // Then, verify the event belongs to that restaurant
    const eventToDelete = await prisma.event.findUnique({
        where: { id: eventId },
        select: { restaurantId: true },
    });

    if (!eventToDelete) {
        return res.status(404).json({ message: 'Event not found.' });
    }

    if (eventToDelete.restaurantId !== restaurant.id) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this event.' });
    }

    // Now, delete the event
    await prisma.event.delete({
      where: { id: eventId },
    });

    return res.status(200).json({ message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
