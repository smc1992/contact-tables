import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';
import { createClient } from '../../../utils/supabase/server';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ message: userError?.message || 'Nicht authentifiziert' });
  }

  const userId = user.id;
  const userRole = user.user_metadata?.role || 'CUSTOMER';

  // Überprüfen, ob der Benutzer ein zahlender Kunde ist, falls er kein Admin ist
  if (userRole !== 'ADMIN') {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { isPaying: true },
    });

    if (!profile || !profile.isPaying) {
      return res.status(403).json({ message: 'Diese Aktion ist nur für bezahlte Benutzer verfügbar.' });
    }
  }

  // POST: Neue Kontaktanfrage erstellen
  if (req.method === 'POST') {
    try {
      const { 
        restaurantId, 
        date, 
        time, 
        partySize, 
        message 
      } = req.body;

      if (!restaurantId || !date || !time || !partySize) {
        return res.status(400).json({ 
          message: 'Restaurant, Datum, Uhrzeit und Anzahl der Personen sind erforderlich' 
        });
      }

      const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant nicht gefunden' });
      }

      const datetime = new Date(`${date}T${time}`);
      if (datetime < new Date()) {
        return res.status(400).json({ message: 'Das Datum liegt in der Vergangenheit' });
      }

      const contactRequest = await prisma.event.create({
        data: {
          title: `Gemeinsames Essen am ${date}`,
          description: message || 'Kontaktanfrage für gemeinsames Essen',
          datetime,
          maxParticipants: Number(partySize),
          price: 0,
          restaurant: { connect: { id: restaurantId } },
          participants: {
            create: {
              profile: { connect: { id: userId } },
              isHost: true
            }
          }
        },
        include: {
          restaurant: { select: { name: true, address: true, city: true, bookingUrl: true, phone: true, email: true, website: true } },
          participants: { include: { profile: { select: { name: true, id: true } } } }
        }
      });

      return res.status(201).json({
        message: 'Kontaktanfrage erfolgreich erstellt',
        contactRequest,
        reservationInfo: {
          message: 'Bitte beachte, dass du noch direkt beim Restaurant reservieren musst.',
          bookingUrl: restaurant.bookingUrl || null,
          phone: restaurant.phone || null,
          email: restaurant.email || null,
          website: restaurant.website || null
        }
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der Kontaktanfrage:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // GET: Kontaktanfragen des Benutzers abrufen
  if (req.method === 'GET') {
    try {
      const { status, date, city, minSeats } = req.query;
            const whereClause: Prisma.EventWhereInput = {};

      if (status === 'host') {
        whereClause.participants = { some: { userId, isHost: true } };
      } else if (status === 'participant') {
        whereClause.participants = { some: { userId, isHost: false } };
      } else if (status) { // Any other status means participated events
        whereClause.participants = { some: { userId } };
      }

      if (date && typeof date === 'string') {
        const selectedDate = new Date(date);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        whereClause.datetime = { gte: selectedDate, lt: nextDay };
      } else {
        whereClause.datetime = { gte: new Date() };
      }

      if (city && typeof city === 'string') {
        whereClause.restaurant = { city: { contains: city, mode: 'insensitive' } };
      }

      const contactRequests = await prisma.event.findMany({
        where: whereClause,
        include: {
          restaurant: { select: { name: true, address: true, city: true, bookingUrl: true, phone: true, email: true, website: true } },
          participants: { include: { profile: { select: { name: true, id: true } } } },
          _count: { select: { participants: true } }
        },
        orderBy: { datetime: 'desc' }
      });

      let processedRequests = contactRequests.map(request => {
        const availableSeats = request.maxParticipants - request._count.participants;
        const isFull = availableSeats <= 0;
        const isPast = new Date(request.datetime) < new Date();
        let currentStatus = 'OPEN';
        if (isPast) currentStatus = 'PAST';
        else if (isFull) currentStatus = 'FULL';
        
        const isHost = request.participants.some(p => p.userId === userId && p.isHost);
        
        return { ...request, availableSeats, isFull, isPast, status: currentStatus, isHost };
      });

      if (minSeats && typeof minSeats === 'string') {
        const minSeatsValue = parseInt(minSeats);
        if (!isNaN(minSeatsValue) && minSeatsValue > 0) {
          processedRequests = processedRequests.filter(r => r.availableSeats >= minSeatsValue);
        }
      }

      return res.status(200).json(processedRequests);
    } catch (error) {
      console.error('Fehler beim Abrufen der Kontaktanfragen:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // DELETE: Kontaktanfrage löschen/abbrechen (nur für Host)
  if (req.method === 'DELETE') {
    try {
      const { eventId } = req.body;
      if (!eventId) return res.status(400).json({ message: 'Event-ID ist erforderlich' });

      const event = await prisma.event.findFirst({
        where: { id: eventId, participants: { some: { userId, isHost: true } } },
        include: { participants: true }
      });

      if (!event) {
        return res.status(404).json({ message: 'Event nicht gefunden oder du bist nicht berechtigt, es zu löschen' });
      }

      for (const participant of event.participants) {
        if (participant.userId !== userId) {
          await prisma.notification.create({
            data: {
              userId: participant.userId,
              title: 'Event abgesagt',
              content: `Das Event "${event.title}" wurde vom Organisator abgesagt.`,
              type: 'EVENT_CANCELLED',
              isRead: false,
              metadata: { eventId: event.id, title: event.title, datetime: event.datetime }
            }
          });
        }
      }

      await prisma.event.delete({ where: { id: eventId } });
      return res.status(200).json({ message: 'Kontaktanfrage erfolgreich gelöscht' });
    } catch (error) {
      console.error('Fehler beim Löschen der Kontaktanfrage:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // PATCH: Teilnahme an einer Kontaktanfrage beenden
  if (req.method === 'PATCH') {
    try {
      const { eventId, action } = req.body;
      if (!eventId || !action) return res.status(400).json({ message: 'Event-ID und Aktion sind erforderlich' });

      const participation = await prisma.eventParticipant.findFirst({
        where: { eventId, userId },
        include: { event: true }
      });

      if (!participation) return res.status(404).json({ message: 'Teilnahme nicht gefunden' });
      if (participation.isHost) return res.status(400).json({ message: 'Als Organisator kannst du nicht austreten. Bitte lösche das Event stattdessen.' });

      if (action === 'leave') {
        await prisma.eventParticipant.delete({ where: { id: participation.id } });

        const host = await prisma.eventParticipant.findFirst({ where: { eventId, isHost: true } });
        if (host) {
          const participantProfile = await prisma.profile.findUnique({ where: { id: userId }, select: { name: true } });
          const participantName = participantProfile?.name || 'Ein Benutzer';

          await prisma.notification.create({
            data: {
              userId: host.userId,
              title: 'Teilnehmer hat dein Event verlassen',
              content: `${participantName} nimmt nicht mehr an deinem Event "${participation.event.title}" teil.`,
              type: 'EVENT_PARTICIPANT_LEFT',
              isRead: false,
              metadata: { eventId, participantId: userId, participantName }
            }
          });
        }
        return res.status(200).json({ message: 'Teilnahme erfolgreich beendet' });
      }

      return res.status(400).json({ message: 'Ungültige Aktion' });
    } catch (error) {
      console.error('Fehler beim Bearbeiten der Teilnahme:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  res.setHeader('Allow', ['POST', 'GET', 'DELETE', 'PATCH']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
