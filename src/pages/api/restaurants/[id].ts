import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: id as string },
        include: {
          ratings: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          events: {
            where: {
              datetime: {
                gte: new Date(),
              },
            },
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      return res.status(200).json(restaurant);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, description, address, city, postalCode, latitude, longitude, contactEmail, bookingUrl, imageUrls } = req.body;

      const restaurant = await prisma.restaurant.update({
        where: { id: id as string },
        data: {
          name,
          description,
          address,
          city,
          postalCode,
          latitude,
          longitude,
          contactEmail,
          bookingUrl,
          imageUrls,
        },
      });

      return res.status(200).json(restaurant);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 