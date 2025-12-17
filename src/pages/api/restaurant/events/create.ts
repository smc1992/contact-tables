import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata.role !== 'RESTAURANT') {
    return res.status(403).json({ message: 'Forbidden: Only restaurant owners can create events.' });
  }

  try {
    // Fetch the restaurant owned by the user to ensure security
    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!restaurant) {
      return res.status(403).json({ message: 'Forbidden: No restaurant associated with this user.' });
    }

    const { 
        title, 
        description, 
        datetime, 
        maxParticipants, 
        price, 
        isPublic 
    } = req.body;

    // Basic validation
    if (!title || !datetime || !maxParticipants || price == null) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        datetime: new Date(datetime),
        maxParticipants: Number(maxParticipants),
        price: Number(price),
        isPublic: Boolean(isPublic),
        restaurantId: restaurant.id, // Use the server-verified restaurant ID
      },
    });

    return res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
  }
}
