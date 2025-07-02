import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import prisma from '../../../lib/prisma'; // Use shared prisma client
import { Prisma } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET is public, no auth needed
  if (req.method === 'GET') {
    const { restaurantId } = req.query;

    if (!restaurantId || typeof restaurantId !== 'string') {
      return res.status(400).json({ message: 'Restaurant ID is required.' });
    }

    try {
      const ratings = await prisma.rating.findMany({
        where: { restaurantId: restaurantId },
        include: {
          profile: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json(ratings);
    } catch (error) {
      console.error('Error fetching ratings:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }

  // All other methods require authentication
  const supabase = createPagesServerClient({ req, res });
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { restaurantId, value, comment } = req.body;

    if (!restaurantId || typeof value !== 'number' || value < 1 || value > 5) {
      return res.status(400).json({ message: 'Restaurant ID and a valid rating (1-5) are required.' });
    }

    try {
      const newRating = await prisma.rating.create({
        data: {
          userId: user.id,
          restaurantId: restaurantId,
          value: value,
          comment: comment,
        },
      });

      // TODO: Consider moving notifications to a separate, asynchronous process
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { userId: true, name: true },
      });

      if (restaurant?.userId) {
        await prisma.notification.create({
          data: {
            userId: restaurant.userId,
            title: `New rating for ${restaurant.name}`,
            content: `You received a new ${value}-star rating.`,
            type: 'NEW_RATING',
          },
        });
      }

      return res.status(201).json(newRating);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'You have already rated this restaurant.' });
      }
      console.error('Error creating rating:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
