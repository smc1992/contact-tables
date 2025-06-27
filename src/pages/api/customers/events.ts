import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: 'Nicht autorisiert' });
  }

  const token = authorization.split(' ')[1];
  const user = await prisma.profile.findUnique({
    where: { id: token },
    select: { role: true, id: true },
  });

  if (!user || user.role !== 'CUSTOMER') {
    return res.status(403).json({ message: 'Zugriff verweigert' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const events = await prisma.event.findMany({
          where: {
            date: {
              gte: new Date(),
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
              where: {
                userId: user.id,
              },
            },
          },
          orderBy: { date: 'asc' },
        });

        return res.status(200).json(events);
      } catch (error) {
        console.error('Fehler beim Abrufen der Events:', error);
        return res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }

    case 'POST':
      try {
        const { eventId } = req.body;

        // Überprüfen, ob das Event existiert und noch Plätze frei sind
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          include: {
            participants: true,
          },
        });

        if (!event) {
          return res.status(404).json({ message: 'Event nicht gefunden' });
        }

        if (event.participants.length >= event.maxParticipants) {
          return res.status(400).json({ message: 'Event ist bereits ausgebucht' });
        }

        // Teilnahme erstellen
        const participation = await prisma.eventParticipant.create({
          data: {
            eventId,
            userId: user.id,
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