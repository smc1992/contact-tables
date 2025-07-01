import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createClient } from '../../../utils/supabase/server';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient({ req, res });
  const {
    data: { user: authUser },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !authUser) {
    return res.status(401).json({ message: userError?.message || 'Nicht autorisiert' });
  }

  const userProfile = await prisma.profile.findUnique({
    where: { id: authUser.id },
    select: {
      role: true,
      restaurant: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!userProfile || userProfile.role !== 'RESTAURANT' || !userProfile.restaurant?.id) {
    return res.status(403).json({ message: 'Zugriff verweigert oder kein Restaurant zugeordnet' });
  }

  const restaurantId = userProfile.restaurant.id;

  switch (req.method) {
    case 'GET':
      try {
        const events = await prisma.event.findMany({
          where: { restaurantId: restaurantId },
          include: {
            participants: {
              include: {
                profile: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { datetime: 'asc' },
        });

        return res.status(200).json(events);
      } catch (error) {
        console.error('Fehler beim Abrufen der Events:', error);
        return res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }

    case 'POST':
      try {
        const { title, description, datetime, maxParticipants, price } = req.body;

        const event = await prisma.event.create({
          data: {
            title,
            description,
            datetime: new Date(datetime),
            maxParticipants,
            price,
            restaurantId: restaurantId,
          },
        });

        return res.status(201).json(event);
      } catch (error) {
        console.error('Fehler beim Erstellen des Events:', error);
        return res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
} 