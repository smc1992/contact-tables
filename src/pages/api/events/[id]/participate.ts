import { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../../../../middleware/auth';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Event-ID ist erforderlich' });
  }

  switch (req.method) {
    case 'POST':
      try {
        // Prüfe, ob der Benutzer ein zahlender Kunde ist
        const profile = await prisma.profile.findUnique({
          where: { id: req.user.id },
          select: { isPaying: true },
        });

        if (!profile?.isPaying) {
          return res.status(403).json({ message: 'Nur für zahlende Mitglieder verfügbar' });
        }

        // Prüfe, ob das Event existiert und noch Plätze frei sind
        const event = await prisma.event.findUnique({
          where: { id: id as string },
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
          // Aktualisiere den Event-Status auf FULL
          await prisma.event.update({
            where: { id: id as string },
            data: { status: 'FULL' },
          });
          return res.status(400).json({ message: 'Event ist bereits ausgebucht' });
        }

        // Prüfe, ob der Benutzer bereits teilnimmt
        const existingParticipation = await prisma.eventParticipant.findUnique({
          where: {
            eventId_userId: {
              eventId: id as string,
              userId: req.user.id,
            },
          },
        });

        if (existingParticipation) {
          return res.status(400).json({ message: 'Sie nehmen bereits an diesem Event teil' });
        }

        // Füge den Benutzer als Teilnehmer hinzu
        const participation = await prisma.eventParticipant.create({
          data: {
            eventId: id as string,
            userId: req.user.id,
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

        // Prüfe, ob das Event jetzt voll ist
        const updatedCount = await prisma.eventParticipant.count({
          where: { eventId: id as string },
        });

        if (updatedCount >= event.maxParticipants) {
          await prisma.event.update({
            where: { id: id as string },
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
        // Prüfe, ob die Teilnahme existiert
        const participation = await prisma.eventParticipant.findUnique({
          where: {
            eventId_userId: {
              eventId: id as string,
              userId: req.user.id,
            },
          },
        });

        if (!participation) {
          return res.status(404).json({ message: 'Teilnahme nicht gefunden' });
        }

        // Entferne die Teilnahme
        await prisma.eventParticipant.delete({
          where: {
            eventId_userId: {
              eventId: id as string,
              userId: req.user.id,
            },
          },
        });

        // Aktualisiere den Event-Status auf OPEN, falls er FULL war
        await prisma.event.updateMany({
          where: {
            id: id as string,
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

// Middleware-Kette für Authentifizierung
export default async function (req: AuthenticatedRequest, res: NextApiResponse) {
  await authenticateToken(req, res, () => {
    handler(req, res);
  });
} 