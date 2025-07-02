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
  
  // Fetch user profile to check for payment status and get user name
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { isPaying: true, name: true },
  });

  if (!profile) {
    return res.status(404).json({ message: 'Benutzerprofil nicht gefunden.' });
  }

  // Admins have full access, others need to be paying users
  const userRole = user.user_metadata?.role || 'CUSTOMER';
  if (userRole !== 'ADMIN' && !profile.isPaying) {
    return res.status(403).json({ message: 'Diese Aktion ist nur für bezahlte Benutzer oder Admins verfügbar.' });
  }

  // POST: Join a contact request
  if (req.method === 'POST') {
    try {
      const { eventId, message } = req.body;

      if (!eventId) {
        return res.status(400).json({ message: 'Event-ID ist erforderlich' });
      }

      // Check if the event exists
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

      // Check if user is already a participant
      const isAlreadyParticipant = event.participants.some(p => p.userId === userId);
      if (isAlreadyParticipant) {
        return res.status(400).json({ message: 'Du nimmst bereits an diesem Kontakttisch teil' });
      }

      // Check for available seats
      const availableSeats = event.maxParticipants - event._count.participants;
      if (availableSeats <= 0) {
        return res.status(400).json({ message: 'Dieser Kontakttisch ist bereits voll' });
      }

      // Check if the event is in the past
      if (new Date(event.datetime) < new Date()) {
        return res.status(400).json({ message: 'Dieser Kontakttisch liegt in der Vergangenheit' });
      }

      // Create participation
      const participation = await prisma.eventParticipant.create({
        data: {
          event: {
            connect: { id: eventId }
          },
          profile: {
            connect: { id: userId },
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
                  profile: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
                where: {
                  isHost: true
                }
              }
            }
          },
          profile: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      // Create notification for the host
      const host = event.participants.find((p: any) => p.isHost);
      if (host) {
        await prisma.notification.create({
          data: {
            userId: host.userId,
            type: 'EVENT_JOIN',
            title: 'Neuer Teilnehmer',
            content: `${profile.name} nimmt jetzt an deinem Kontakttisch "${event.title}" teil.`,
            metadata: {
              eventId,
              participantId: userId,
              participantName: profile.name
            }
          }
        });
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
