import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Nur POST-Anfragen zulassen
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Benutzer-Session überprüfen
    const supabase = createPagesServerClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'Event-ID ist erforderlich' });
    }

    // Überprüfen, ob das Event existiert
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: true
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event nicht gefunden' });
    }

    // Überprüfen, ob der Benutzer bereits teilnimmt
    const isAlreadyParticipating = event.participants.some(
      participant => participant.userId === session.user.id
    );

    if (isAlreadyParticipating) {
      return res.status(400).json({ message: 'Du nimmst bereits an diesem Event teil' });
    }

    // Überprüfen, ob das Event voll ist
    if (event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ message: 'Das Event ist bereits voll' });
    }

    // Teilnahme hinzufügen
    const participation = await prisma.eventParticipant.create({
      data: {
        event: {
          connect: { id: eventId }
        },
        user: {
          connect: { id: session.user.id }
        },
        isHost: false
      },
      include: {
        event: {
          include: {
            restaurant: {
              select: {
                name: true,
                address: true,
                city: true
              }
            },
            participants: {
              include: {
                user: {
                  select: {
                    name: true,
                    id: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            id: true
          }
        }
      }
    });

    // Benachrichtigung an den Host senden
    const host = event.participants.find(participant => participant.isHost);
    
    if (host) {
      await prisma.notification.create({
        data: {
          userId: host.userId,
          title: 'Neue Teilnahme an deinem Event',
          message: `${session.user.name} nimmt an deinem Event "${event.title}" teil.`,
          type: 'EVENT_PARTICIPATION',
          read: false,
          data: JSON.stringify({
            eventId: event.id,
            participantId: session.user.id
          })
        }
      });
    }

    return res.status(200).json({
      message: 'Erfolgreich am Event teilgenommen',
      participation
    });
  } catch (error) {
    console.error('Fehler bei der Teilnahme am Event:', error);
    return res.status(500).json({ 
      message: 'Interner Serverfehler', 
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
    });
  }
}
