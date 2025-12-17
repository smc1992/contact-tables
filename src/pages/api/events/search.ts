import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      city, 
      date, 
      minSeats = 1,
      cuisine,
      page = '1',
      limit = '10'
    } = req.query;

    // Erstelle die Abfragebedingungen
    const whereClause: any = {
      datetime: {
        gte: new Date() // Nur zukünftige Events
      }
    };

    // Filtere nach Datum, wenn angegeben
    if (date) {
      const startDate = new Date(`${date}T00:00:00`);
      const endDate = new Date(`${date}T23:59:59`);
      
      whereClause.datetime = {
        gte: startDate,
        lte: endDate
      };
    }

    // Filtere nach Mindestanzahl an verfügbaren Plätzen
    if (minSeats) {
      whereClause.maxParticipants = {
        gte: Number(minSeats)
      };
    }

    // Filtere nach Stadt, wenn angegeben
    if (city) {
      whereClause.restaurant = {
        city: {
          contains: city as string,
          mode: 'insensitive'
        }
      };
    }

    // Filtere nach Küche, wenn angegeben
    if (cuisine) {
      if (!whereClause.restaurant) {
        whereClause.restaurant = {};
      }
      
      whereClause.restaurant.cuisine = {
        contains: cuisine as string,
        mode: 'insensitive'
      };
    }

    // Berechne Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Führe die Abfrage aus
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where: whereClause,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              cuisine: true,
              imageUrl: true
            }
          },
          participants: {
            select: {
              userId: true,
              isHost: true,
              profile: {
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
          datetime: 'asc'
        },
        skip,
        take: limitNum
      }),
      prisma.event.count({
        where: whereClause
      })
    ]);

    // Berechne verfügbare Plätze und füge sie zu den Ergebnissen hinzu
    const eventsWithAvailability = events.map(event => {
      const availableSeats = event.maxParticipants - event._count.participants;
      const isFull = availableSeats <= 0;
      
      return {
        ...event,
        availableSeats,
        isFull,
        status: isFull ? 'FULL' : 'OPEN'
      };
    });

    // Erstelle Pagination-Metadaten
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      events: eventsWithAvailability,
      pagination: {
        totalEvents: totalCount,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        city: city || null,
        date: date || null,
        minSeats: minSeats || 1,
        cuisine: cuisine || null
      }
    });
  } catch (error) {
    console.error('Fehler bei der Suche nach Events:', error);
    return res.status(500).json({ 
      message: 'Interner Serverfehler', 
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
    });
  }
}
