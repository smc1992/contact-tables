import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const userId = session.user.id;
  const { id: eventId } = req.query;

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ message: 'Event-ID ist erforderlich' });
  }

  switch (req.method) {
    case 'POST':
      try {
        const profile = await prisma.profile.findUnique({
          where: { id: userId },
          select: { isPaying: true },
        });

        if (!profile?.isPaying && session.user.user_metadata?.role !== 'ADMIN') {
          return res.status(403).json({ message: 'Nur für zahlende Mitglieder oder Admins verfügbar' });
        }

        const event = await prisma.event.findUnique({
          where: { id: eventId },
          include: {
            _count: {
              select: { participants: true },
            },
          },
        });

        if (!event) {
          return res.status(404).json({ message: 'Event nicht gefunden' });
        }

        if (event.status !== 'OPEN') {
          return res.status(400).json({ message: 'Event ist nicht mehr verfügbar' });
        }

        if (event._count.participants >= event.maxParticipants) {
          await prisma.event.update({
            where: { id: eventId },
            data: { status: 'FULL' },
          });
          return res.status(400).json({ message: 'Event ist bereits ausgebucht' });
        }

        const existingParticipation = await prisma.eventParticipant.findUnique({
          where: {
            eventId_userId: {
              eventId: eventId,
              userId: userId,
            },
          },
        });

        if (existingParticipation) {
          return res.status(400).json({ message: 'Sie nehmen bereits an diesem Event teil' });
        }

        const participation = await prisma.eventParticipant.create({
          data: {
            eventId: eventId,
            userId: userId,
          },
          include: {
            event: {
              include: {
                restaurant: {
                  select: {
                    name: true,
                    address: true,
                    city: true,
                  },
                },
              },
            },
          },
        });

        const updatedCount = await prisma.eventParticipant.count({
          where: { eventId: eventId },
        });

        if (updatedCount >= event.maxParticipants) {
          await prisma.event.update({
            where: { id: eventId },
            data: { status: 'FULL' },
          });
        }

        res.status(201).json(participation);
      } catch (error) {
        console.error('Error participating in event:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    case 'DELETE':
      try {
        const participation = await prisma.eventParticipant.findUnique({
          where: {
            eventId_userId: {
              eventId: eventId,
              userId: userId,
            },
          },
        });

        if (!participation) {
          return res.status(404).json({ message: 'Teilnahme nicht gefunden' });
        }

        await prisma.eventParticipant.delete({
          where: {
            eventId_userId: {
              eventId: eventId,
              userId: userId,
            },
          },
        });

        await prisma.event.updateMany({
          where: {
            id: eventId,
            status: 'FULL',
          },
          data: { status: 'OPEN' },
        });

        res.status(204).end();
      } catch (error) {
        console.error('Error canceling event participation:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    default:
      res.setHeader('Allow', ['POST', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 