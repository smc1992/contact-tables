import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const userId = session.user.id;
  
  // Überprüfen, ob der Benutzer bezahlt hat
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user || (!user.isPaying && user.role !== 'ADMIN')) {
    return res.status(403).json({ message: 'Nur bezahlte Benutzer können Kontakttische nutzen' });
  }

  // POST: Einer Kontaktanfrage beitreten
  if (req.method === 'POST') {
    try {
      const { eventId, message } = req.body;

      if (!eventId) {
        return res.status(400).json({ message: 'Event-ID ist erforderlich' });
      }

      // Überprüfen, ob die Kontaktanfrage existiert
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          participants: true,
          _count: {
            select: {
              participants: true
            }
          }
        }
      });

      if (!event) {
        return res.status(404).json({ message: 'Kontaktanfrage nicht gefunden' });
      }

      // Überprüfen, ob der Benutzer bereits teilnimmt
      const isAlreadyParticipant = event.participants.some(p => p.userId === userId);
      if (isAlreadyParticipant) {
        return res.status(400).json({ message: 'Du nimmst bereits an diesem Kontakttisch teil' });
      }

      // Überprüfen, ob noch Plätze verfügbar sind
      const availableSeats = event.maxParticipants - event._count.participants;
      if (availableSeats <= 0) {
        return res.status(400).json({ message: 'Dieser Kontakttisch ist bereits voll' });
      }

      // Überprüfen, ob das Event in der Vergangenheit liegt
      if (new Date(event.datetime) < new Date()) {
        return res.status(400).json({ message: 'Dieser Kontakttisch liegt in der Vergangenheit' });
      }

      // Teilnahme erstellen
      const participation = await prisma.eventParticipant.create({
        data: {
          event: {
            connect: { id: eventId }
          },
          user: {
            connect: { id: userId }
          },
          isHost: false,
          message: message || null
        },
        include: {
          event: {
            include: {
              restaurant: {
                select: {
                  name: true
                }
              },
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                },
                where: {
                  isHost: true
                }
              }
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      // Benachrichtigung für den Host erstellen
      const host = event.participants.find((p: any) => p.isHost);
      if (host) {
        await prisma.notification.create({
          data: {
            userId: host.userId,
            type: 'EVENT_JOIN',
            title: 'Neuer Teilnehmer',
            content: `${session.user.name} nimmt jetzt an deinem Kontakttisch "${event.title}" teil.`,
            metadata: {
              eventId,
              participantId: userId,
              participantName: session.user.name
            }
          }
        });

        // Hier könnte man auch eine E-Mail an den Host senden
      }

      return res.status(200).json({
        message: 'Du nimmst jetzt an diesem Kontakttisch teil',
        participation
      });
    } catch (error) {
      console.error('Fehler beim Beitreten zur Kontaktanfrage:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  return res.status(405).json({ message: 'Methode nicht erlaubt' });
}
