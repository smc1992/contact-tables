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

  if (user.user_metadata?.role !== 'CUSTOMER') {
    return res.status(403).json({ message: 'Zugriff verweigert. Nur für Kunden.' });
  }

  const userId = user.id;

  switch (req.method) {
    case 'GET':
      try {
        // Fetch all future events the user is participating in
        const events = await prisma.event.findMany({
          where: {
            datetime: {
              gte: new Date(),
            },
            participants: {
              some: { 
                userId: userId 
              },
            },
          },
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
            participants: {
              include: {
                profile: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
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
        const { eventId } = req.body;

        const event = await prisma.event.findUnique({
          where: { id: eventId },
          include: {
            _count: {
              select: { participants: true }
            }
          },
        });

        if (!event) {
          return res.status(404).json({ message: 'Event nicht gefunden' });
        }

        if (event._count.participants >= event.maxParticipants) {
          return res.status(400).json({ message: 'Event ist bereits ausgebucht' });
        }

        // Create participation
        const participation = await prisma.eventParticipant.create({
          data: {
            event: {
              connect: { id: eventId },
            },
            profile: {
              connect: { id: userId },
            },
          },
        });

        return res.status(201).json(participation);
      } catch (error) {
        console.error('Fehler beim Erstellen der Teilnahme:', error);
        return res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
} 