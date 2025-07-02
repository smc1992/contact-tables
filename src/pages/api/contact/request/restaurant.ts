import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const userId = user.id;

  // Check if the user is a restaurant user by checking their profile and role
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    include: {
      restaurant: true,
    },
  });

  if (!profile || user.user_metadata?.role !== 'RESTAURANT' || !profile.restaurant) {
    return res.status(403).json({ message: 'Nur Restaurant-Benutzer können auf diese Ressource zugreifen' });
  }

  const restaurantId = profile.restaurant.id;

  // GET: Get contact tables for the restaurant
  if (req.method === 'GET') {
    try {
      const { date } = req.query;

      // Create date filter
      let dateFilter = {};
      if (date && typeof date === 'string') {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        dateFilter = {
          datetime: {
            gte: startDate,
            lte: endDate,
          },
        };
      }

      // Get contact tables
      const contactTables = await prisma.event.findMany({
        where: {
          restaurantId,
          ...dateFilter,
        },
        include: {
          participants: {
            include: {
              profile: { // Corrected from 'user' to 'profile'
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: {
          datetime: 'asc',
        },
      });

      // Prepare data for the response
      const formattedTables = contactTables.map(table => {
        const availableSeats = table.maxParticipants - table._count.participants;
        const isPast = new Date(table.datetime) < new Date();

        let status: 'OPEN' | 'FULL' | 'PAST' = 'OPEN';
        if (isPast) {
          status = 'PAST';
        } else if (availableSeats <= 0) {
          status = 'FULL';
        }

        return {
          ...table,
          availableSeats,
          status,
          isPast,
        };
      });

      return res.status(200).json({
        message: 'Kontakttische erfolgreich abgerufen',
        contactTables: formattedTables,
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Kontakttische:', error);
      return res.status(500).json({ message: 'Interner Serverfehler' });
    }
  }

  // Other HTTP methods are not supported
  return res.status(405).json({ message: 'Methode nicht erlaubt' });
}
