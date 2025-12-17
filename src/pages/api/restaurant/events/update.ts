import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT');
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata.role !== 'RESTAURANT') {
    return res.status(403).json({ message: 'Forbidden: User is not authenticated or not a restaurant owner.' });
  }

  const { 
      eventId, 
      title, 
      description, 
      datetime, 
      maxParticipants, 
      price, 
      isPublic 
  } = req.body;

  if (!eventId || !title || !datetime || !maxParticipants || price == null) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    // Security Check: Verify the user owns the event they are trying to update.
    const restaurant = await prisma.restaurant.findUnique({
        where: { userId: user.id },
        select: { id: true },
    });

    if (!restaurant) {
        return res.status(403).json({ message: 'Forbidden: No restaurant associated with this user.' });
    }

    const eventToUpdate = await prisma.event.findFirst({
        where: {
            id: eventId,
            restaurantId: restaurant.id,
        }
    });

    if (!eventToUpdate) {
        return res.status(404).json({ message: 'Event not found or you do not have permission to edit it.' });
    }

    // Proceed with the update
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        description,
        datetime: new Date(datetime),
        maxParticipants: Number(maxParticipants),
        price: Number(price),
        isPublic: Boolean(isPublic),
      },
    });

    return res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
