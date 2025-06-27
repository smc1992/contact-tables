import { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../../../middleware/auth';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { page = '1', limit = '10', status } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where = {
          ...(status && { status }),
          restaurant: {
            isVisible: true,
          },
        };

        const [events, total] = await Promise.all([
          prisma.event.findMany({
            where,
            include: {
              restaurant: {
                select: {
                  name: true,
                  address: true,
                  city: true,
                  imageUrl: true,
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

        res.status(200).json({
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
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    case 'POST':
      try {
        // Nur Restaurant-Benutzer können Events erstellen
        if (req.user.role !== 'RESTAURANT') {
          return res.status(403).json({ message: 'Keine Berechtigung' });
        }

        const {
          datetime,
          maxParticipants,
          notes,
        } = req.body;

        // Validierung
        if (!datetime || !maxParticipants) {
          return res.status(400).json({ message: 'Datum/Uhrzeit und maximale Teilnehmerzahl sind erforderlich' });
        }

        // Finde das Restaurant des Benutzers
        const restaurant = await prisma.restaurant.findUnique({
          where: { userId: req.user.id },
        });

        if (!restaurant) {
          return res.status(404).json({ message: 'Restaurant nicht gefunden' });
        }

        const event = await prisma.event.create({
          data: {
            restaurantId: restaurant.id,
            datetime: new Date(datetime),
            maxParticipants,
            notes,
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

        res.status(201).json(event);
      } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    case 'PATCH':
      try {
        const { id } = req.query;
        const { status } = req.body;

        if (!id) {
          return res.status(400).json({ message: 'Event-ID ist erforderlich' });
        }

        // Prüfe, ob der Benutzer das Event bearbeiten darf
        const event = await prisma.event.findUnique({
          where: { id: id as string },
          include: {
            restaurant: true,
          },
        });

        if (!event) {
          return res.status(404).json({ message: 'Event nicht gefunden' });
        }

        if (req.user.role === 'RESTAURANT' && event.restaurant.userId !== req.user.id) {
          return res.status(403).json({ message: 'Keine Berechtigung' });
        }

        const updatedEvent = await prisma.event.update({
          where: { id: id as string },
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

        res.status(200).json(updatedEvent);
      } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Middleware-Kette für Authentifizierung
export default async function (req: AuthenticatedRequest, res: NextApiResponse) {
  await authenticateToken(req, res, () => {
    handler(req, res);
  });
} 