import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET is a public endpoint, no authentication required
  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '10', status } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {
        restaurant: {
          isVisible: true,
        },
      };
      if (status && typeof status === 'string') {
        where.status = status;
      }

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          include: {
            restaurant: {
              select: {
                name: true,
                address: true,
                city: true,
              },
            },
            _count: {
              select: {
                participants: true,
              },
            },
          },
          skip,
          take: parseInt(limit as string),
          orderBy: {
            datetime: 'asc',
          },
        }),
        prisma.event.count({ where }),
      ]);

      return res.status(200).json({
        events,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
          currentPage: parseInt(page as string),
          perPage: parseInt(limit as string),
        },
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
    }
  }

  // For POST and PATCH, we need an authenticated user
  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }
  const userId = user.id;
  const userRole = user.user_metadata?.role;

  switch (req.method) {
    case 'POST':
      try {
        if (userRole !== 'RESTAURANT') {
          return res.status(403).json({ message: 'Keine Berechtigung' });
        }

        const {
          datetime,
          maxParticipants,
          notes,
          title,
          description,
        } = req.body;

        if (!datetime || !maxParticipants || !title) {
          return res.status(400).json({ message: 'Titel, Datum/Uhrzeit und maximale Teilnehmerzahl sind erforderlich' });
        }

        const restaurant = await prisma.restaurant.findUnique({
          where: { userId: userId },
        });

        if (!restaurant) {
          return res.status(404).json({ message: 'Restaurant nicht gefunden' });
        }

        const event = await prisma.event.create({
          data: {
            restaurantId: restaurant.id,
            datetime: new Date(datetime),
            maxParticipants: Number(maxParticipants),
            title,
            description,
            status: 'OPEN',
          },
          include: {
            restaurant: {
              select: {
                name: true,
                address: true,
                city: true,
              },
            },
          },
        });

        return res.status(201).json(event);
      } catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }

    case 'PATCH':
      try {
        const { id } = req.query;
        const { status } = req.body;

        if (!id || typeof id !== 'string') {
          return res.status(400).json({ message: 'Event-ID ist erforderlich' });
        }

        const event = await prisma.event.findUnique({
          where: { id: id },
          include: {
            restaurant: true,
          },
        });

        if (!event) {
          return res.status(404).json({ message: 'Event nicht gefunden' });
        }

        if (userRole !== 'ADMIN' && (userRole !== 'RESTAURANT' || event.restaurant.userId !== userId)) {
          return res.status(403).json({ message: 'Keine Berechtigung' });
        }

        const updatedEvent = await prisma.event.update({
          where: { id: id },
          data: {
            status,
          },
          include: {
            restaurant: {
              select: {
                name: true,
                address: true,
                city: true,
              },
            },
          },
        });

        return res.status(200).json(updatedEvent);
      } catch (error) {
        console.error('Error updating event:', error);
        return res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 