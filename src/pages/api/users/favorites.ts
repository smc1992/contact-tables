import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import prisma from '../../../lib/prisma';
import { Prisma, Restaurant } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const favorites = await prisma.favorite.findMany({
        where: { userId: user.id },
        include: {
          restaurant: true,
        },
      });

      const favoriteRestaurants = favorites
        .map((fav) => fav.restaurant)
        .filter((r): r is Restaurant => r !== null);

      return res.status(200).json(favoriteRestaurants);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    const { restaurantId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    try {
      const newFavorite = await prisma.favorite.create({
        data: {
          userId: user.id,
          restaurantId: restaurantId,
        },
      });
      return res.status(201).json(newFavorite);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existingFavorite = await prisma.favorite.findUnique({
          where: { userId_restaurantId: { userId: user.id, restaurantId } },
        });
        return res.status(200).json(existingFavorite);
      }
      console.error('Error adding favorite:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  } else if (req.method === 'DELETE') {
    const { restaurantId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    try {
      await prisma.favorite.delete({
        where: {
          userId_restaurantId: {
            userId: user.id,
            restaurantId: restaurantId,
          },
        },
      });
      return res.status(204).end();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ message: 'Favorite not found.' });
      }
      console.error('Error deleting favorite:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
