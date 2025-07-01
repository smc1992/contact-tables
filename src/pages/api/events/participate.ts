import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'Event-ID ist erforderlich' });
    }

    // Fetch event and current user's profile in parallel
    const [event, currentUserProfile] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        include: {
          participants: true, // includes profileId
        }
      }),
      prisma.profile.findUnique({
        where: { id: session.user.id }
      })
    ]);

    if (!event) {
      return res.status(404).json({ message: 'Event nicht gefunden' });
    }
    
    if (!currentUserProfile) {
        return res.status(404).json({ message: 'Benutzerprofil nicht gefunden' });
    }

    const isAlreadyParticipating = event.participants.some(
      participant => participant.userId === session.user.id
    );

    if (isAlreadyParticipating) {
      return res.status(400).json({ message: 'Du nimmst bereits an diesem Event teil' });
    }

    if (event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ message: 'Das Event ist bereits voll' });
    }

    const participation = await prisma.eventParticipant.create({
      data: {
        event: {
          connect: { id: eventId }
        },
        profile: { // Corrected from user
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
                profile: { // Corrected from user
                  select: {
                    name: true,
                    id: true
                  }
                }
              }
            }
          }
        },
        profile: { // Corrected from user
          select: {
            name: true,
            id: true
          }
        }
      }
    });

    // Find host to send notification
    const host = event.participants.find(participant => participant.isHost);
    
    if (host && host.userId) {
      await prisma.notification.create({
        data: {
          profile: {
            connect: { id: host.userId }
          },
          title: 'Neue Teilnahme an deinem Event',
          content: `${currentUserProfile.name || 'Ein Benutzer'} nimmt an deinem Event "${event.title}" teil.`,
          type: 'EVENT_PARTICIPATION'
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
