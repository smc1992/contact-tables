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
  const user = await prisma.profile.findUnique({
    where: { id: userId }
  });
  
  if (!user || (!user.isPaying && user.role !== 'ADMIN')) {
    return res.status(403).json({ message: 'Nur bezahlte Benutzer können Kontakttische nutzen' });
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

      // Validierung
      if (!restaurantId || !date || !time || !partySize) {
        return res.status(400).json({ 
          message: 'Restaurant, Datum, Uhrzeit und Anzahl der Personen sind erforderlich' 
        });
      }

      // Überprüfen, ob das Restaurant existiert
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });

      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant nicht gefunden' });
      }

      // Datum und Uhrzeit kombinieren
      const datetime = new Date(`${date}T${time}`);
      
      // Überprüfen, ob das Datum in der Vergangenheit liegt
      if (datetime < new Date()) {
        return res.status(400).json({ message: 'Das Datum liegt in der Vergangenheit' });
      }

      // Neue Kontaktanfrage erstellen
      const contactRequest = await prisma.event.create({
        data: {
          title: `Gemeinsames Essen am ${date}`,
          description: message || 'Kontaktanfrage für gemeinsames Essen',
          datetime,
          maxParticipants: Number(partySize),
          price: 0,
          restaurant: {
            connect: { id: restaurantId }
          },
          participants: {
            create: {
              user: {
                connect: { id: userId }
              },
              isHost: true
            }
          }
        },
        include: {
          restaurant: {
            select: {
              name: true,
              address: true,
              city: true,
              bookingUrl: true,
              phone: true,
              email: true,
              website: true
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
      });

      return res.status(201).json({
        message: 'Kontaktanfrage erfolgreich erstellt',
        contactRequest,
        // Hinweis zur direkten Reservierung beim Restaurant
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
      
      // Filterbedingungen basierend auf dem Status
      let whereClause: any = {};
      
      // Filtere nach Status, wenn angegeben
      if (status === 'host') {
        whereClause.participants = {
          some: {
            userId,
            isHost: true
          }
        };
      } else if (status === 'participant') {
        whereClause.participants = {
          some: {
            userId,
            isHost: false
          }
        };
      } else if (!status) {
        // Wenn kein Status angegeben ist, zeige alle verfügbaren Kontakttische
        // Hier filtern wir nicht nach Teilnahme des aktuellen Benutzers
      } else {
        whereClause.participants = {
          some: {
            userId
          }
        };
      }
      
      // Filtere nach Datum, wenn angegeben
      if (date && typeof date === 'string') {
        const selectedDate = new Date(date);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        whereClause.datetime = {
          gte: selectedDate,
          lt: nextDay
        };
      } else if (!date) {
        // Standardmäßig nur zukünftige Events anzeigen
        whereClause.datetime = {
          gte: new Date()
        };
      }
      
      // Filtere nach Stadt, wenn angegeben
      if (city && typeof city === 'string') {
        whereClause.restaurant = {
          city: {
            contains: city,
            mode: 'insensitive'
          }
        };
      }
      
      // Filtere nach Mindestanzahl freier Plätze
      if (minSeats && typeof minSeats === 'string') {
        const minSeatsValue = parseInt(minSeats);
        if (!isNaN(minSeatsValue) && minSeatsValue > 0) {
          // Diese Bedingung wird später manuell gefiltert, da wir die verfügbaren Plätze berechnen müssen
        }
      }

      // Kontaktanfragen abrufen
      const contactRequests = await prisma.event.findMany({
        where: whereClause,
        include: {
          restaurant: {
            select: {
              name: true,
              address: true,
              city: true,
              bookingUrl: true,
              phone: true,
              email: true,
              website: true
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
          },
          _count: {
            select: {
              participants: true
            }
          }
        },
        orderBy: {
          datetime: 'desc'
        }
      });

      // Verfügbarkeit und Status berechnen
      const processedRequests = contactRequests.map(request => {
        const availableSeats = request.maxParticipants - request._count.participants;
        const isFull = availableSeats <= 0;
        const isPast = new Date(request.datetime) < new Date();
        
        let status = 'OPEN';
        if (isPast) status = 'PAST';
        else if (isFull) status = 'FULL';
        
        // Überprüfen, ob der aktuelle Benutzer der Host ist
        const isHost = request.participants.some(p => p.userId === userId && p.isHost);
        
        return {
          ...request,
          availableSeats,
          isFull,
          isPast,
          status,
          isHost
        };
      });

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

      if (!eventId) {
        return res.status(400).json({ message: 'Event-ID ist erforderlich' });
      }

      // Überprüfen, ob der Benutzer der Host ist
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          participants: {
            some: {
              userId,
              isHost: true
            }
          }
        },
        include: {
          participants: true
        }
      });

      if (!event) {
        return res.status(404).json({ 
          message: 'Event nicht gefunden oder du bist nicht berechtigt, es zu löschen' 
        });
      }

      // Benachrichtigungen an alle Teilnehmer senden
      for (const participant of event.participants) {
        if (participant.userId !== userId) {
          await prisma.notification.create({
            data: {
              userId: participant.userId,
              title: 'Event abgesagt',
              message: `Das Event "${event.title}" wurde vom Organisator abgesagt.`,
              type: 'EVENT_CANCELLED',
              read: false,
              data: JSON.stringify({
                eventId: event.id,
                title: event.title,
                datetime: event.datetime
              })
            }
          });
        }
      }

      // Event löschen
      await prisma.event.delete({
        where: { id: eventId }
      });

      return res.status(200).json({
        message: 'Kontaktanfrage erfolgreich gelöscht'
      });
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

      if (!eventId || !action) {
        return res.status(400).json({ message: 'Event-ID und Aktion sind erforderlich' });
      }

      // Überprüfen, ob der Benutzer an dem Event teilnimmt
      const participation = await prisma.eventParticipant.findFirst({
        where: {
          eventId,
          userId
        },
        include: {
          event: true
        }
      });

      if (!participation) {
        return res.status(404).json({ message: 'Teilnahme nicht gefunden' });
      }

      // Host kann nicht austreten, sondern muss das Event löschen
      if (participation.isHost) {
        return res.status(400).json({ 
          message: 'Als Organisator kannst du nicht austreten. Bitte lösche das Event stattdessen.' 
        });
      }

      if (action === 'leave') {
        // Teilnahme beenden
        await prisma.eventParticipant.delete({
          where: {
            id: participation.id
          }
        });

        // Benachrichtigung an den Host senden
        const host = await prisma.eventParticipant.findFirst({
          where: {
            eventId,
            isHost: true
          }
        });

        if (host) {
          await prisma.notification.create({
            data: {
              userId: host.userId,
              title: 'Teilnehmer hat dein Event verlassen',
              message: `${session.user.name} nimmt nicht mehr an deinem Event "${participation.event.title}" teil.`,
              type: 'EVENT_PARTICIPANT_LEFT',
              read: false,
              data: JSON.stringify({
                eventId,
                participantId: userId,
                participantName: session.user.name
              })
            }
          });
        }

        return res.status(200).json({
          message: 'Teilnahme erfolgreich beendet'
        });
      }

      return res.status(400).json({ message: 'Ungültige Aktion' });
    } catch (error) {
      console.error('Fehler beim Beenden der Teilnahme:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // Andere HTTP-Methoden nicht erlaubt
  return res.status(405).json({ message: 'Method not allowed' });
}
