import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';
import { withAdminAuth } from '../middleware/withAdminAuth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EventsResponse {
  ok: boolean;
  message?: string;
  data?: any;
}

/**
 * API-Route für das Admin-Events-Management
 * 
 * Diese Route ermöglicht es Administratoren, alle Events zu verwalten,
 * einschließlich Erstellung, Aktualisierung, Löschung und Abfrage von Events.
 * 
 * Query-Parameter für GET:
 * - page: Seitennummer für Pagination
 * - pageSize: Anzahl der Einträge pro Seite
 * - status: 'upcoming', 'past', 'all' (Standard: 'all')
 * - restaurantId: (optional) Filter nach Restaurant-ID
 * - search: (optional) Suchbegriff für Event-Name
 */
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EventsResponse>,
  userId: string
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getEvents(req, res);
      case 'POST':
        return await createEvent(req, res);
      case 'PUT':
        return await updateEvent(req, res);
      case 'DELETE':
        return await deleteEvent(req, res);
      default:
        return res.status(405).json({ ok: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in events API:', error);
    return res.status(500).json({
      ok: false,
      message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * GET: Abrufen von Events mit Filtern und Pagination
 */
async function getEvents(req: NextApiRequest, res: NextApiResponse<EventsResponse>) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const status = (req.query.status as string) || 'all';
  const restaurantId = req.query.restaurantId as string;
  const search = req.query.search as string;
  
  const skip = (page - 1) * pageSize;
  
  // Erstelle die Filterbedingungen
  const where: any = {};
  
  // Status-Filter
  if (status === 'upcoming') {
    where.datetime = { gte: new Date() };
  } else if (status === 'past') {
    where.datetime = { lt: new Date() };
  }
  
  // Restaurant-Filter
  if (restaurantId) {
    where.restaurantId = restaurantId;
  }
  
  // Suchfilter
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  
  try {
    // Abfrage der Events mit Filtern
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              profileId: true,
            },
          },
          _count: {
            select: { participants: true }
          },
          participants: {
            take: 5, // Nur die ersten 5 Teilnehmer laden
            include: {
              profile: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          },
        },
        orderBy: { datetime: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.event.count({ where }),
    ]);
    
    // Zusätzliche Statistiken berechnen
    const eventsWithStats = events.map(event => {
      const participationRate = event.maxParticipants > 0 
        ? (event._count.participants / event.maxParticipants) * 100 
        : 0;
      
      return {
        ...event,
        stats: {
          participationRate: parseFloat(participationRate.toFixed(2)),
          isFull: event._count.participants >= event.maxParticipants,
          participantsCount: event._count.participants,
          remainingSpots: Math.max(0, event.maxParticipants - event._count.participants),
        }
      };
    });
    
    // Gesamtstatistiken berechnen
    const totalEvents = await prisma.event.count();
    const upcomingEvents = await prisma.event.count({
      where: { datetime: { gte: new Date() } }
    });
    const pastEvents = totalEvents - upcomingEvents;
    
    // Durchschnittliche Teilnehmerrate berechnen
    const participationStats = await prisma.event.aggregate({
      _avg: {
        maxParticipants: true,
      },
      where: { datetime: { lt: new Date() } } // Nur vergangene Events
    });
    
    const avgParticipantsPerEvent = await prisma.eventParticipant.groupBy({
      by: ['eventId'],
      _count: {
        eventId: true
      },
      having: {
        eventId: {
          _count: {
            gt: 0
          }
        }
      }
    }).then(groups => {
      if (groups.length === 0) return 0;
      const sum = groups.reduce((acc, group) => acc + group._count.eventId, 0);
      return sum / groups.length;
    });
    
    return res.status(200).json({
      ok: true,
      message: 'Events retrieved successfully',
      data: {
        events: eventsWithStats,
        pagination: {
          total: totalCount,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
        },
        stats: {
          totalEvents,
          upcomingEvents,
          pastEvents,
          avgMaxParticipants: participationStats._avg.maxParticipants || 0,
          avgActualParticipants: parseFloat(avgParticipantsPerEvent.toFixed(2)),
          avgParticipationRate: participationStats._avg.maxParticipants 
            ? parseFloat((avgParticipantsPerEvent / participationStats._avg.maxParticipants * 100).toFixed(2))
            : 0,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({
      ok: false,
      message: `Error fetching events: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * POST: Erstellen eines neuen Events
 */
async function createEvent(req: NextApiRequest, res: NextApiResponse<EventsResponse>) {
  const { 
    name, 
    description, 
    datetime, 
    duration, 
    maxParticipants, 
    restaurantId, 
    price,
    isPublic,
    tags,
    imageUrl
  } = req.body;
  
  // Validierung der Pflichtfelder
  if (!name || !datetime || !restaurantId) {
    return res.status(400).json({
      ok: false,
      message: 'Missing required fields: name, datetime, restaurantId'
    });
  }
  
  try {
    // Prüfen, ob das Restaurant existiert
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });
    
    if (!restaurant) {
      return res.status(404).json({
        ok: false,
        message: 'Restaurant not found'
      });
    }
    
    // Event erstellen
    const event = await prisma.event.create({
      data: {
        name,
        description,
        datetime: new Date(datetime),
        duration: duration || 120, // Default: 2 Stunden
        maxParticipants: maxParticipants || 10, // Default: 10 Teilnehmer
        restaurant: {
          connect: { id: restaurantId }
        },
        price: price || 0,
        isPublic: isPublic !== undefined ? isPublic : true,
        tags: tags || [],
        imageUrl: imageUrl || null,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          }
        }
      }
    });
    
    return res.status(201).json({
      ok: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({
      ok: false,
      message: `Error creating event: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * PUT: Aktualisieren eines bestehenden Events
 */
async function updateEvent(req: NextApiRequest, res: NextApiResponse<EventsResponse>) {
  const { id } = req.query;
  const { 
    name, 
    description, 
    datetime, 
    duration, 
    maxParticipants, 
    restaurantId, 
    price,
    isPublic,
    tags,
    imageUrl,
    status
  } = req.body;
  
  if (!id) {
    return res.status(400).json({
      ok: false,
      message: 'Missing event ID'
    });
  }
  
  try {
    // Prüfen, ob das Event existiert
    const existingEvent = await prisma.event.findUnique({
      where: { id: id as string },
      include: {
        _count: {
          select: { participants: true }
        }
      }
    });
    
    if (!existingEvent) {
      return res.status(404).json({
        ok: false,
        message: 'Event not found'
      });
    }
    
    // Prüfen, ob die maximale Teilnehmerzahl reduziert wird und bereits mehr Teilnehmer angemeldet sind
    if (maxParticipants && maxParticipants < existingEvent._count.participants) {
      return res.status(400).json({
        ok: false,
        message: `Cannot reduce max participants below current participant count (${existingEvent._count.participants})`
      });
    }
    
    // Prüfen, ob das Restaurant existiert, falls es geändert wird
    if (restaurantId && restaurantId !== existingEvent.restaurantId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });
      
      if (!restaurant) {
        return res.status(404).json({
          ok: false,
          message: 'Restaurant not found'
        });
      }
    }
    
    // Event aktualisieren
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (datetime !== undefined) updateData.datetime = new Date(datetime);
    if (duration !== undefined) updateData.duration = duration;
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;
    if (price !== undefined) updateData.price = price;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (tags !== undefined) updateData.tags = tags;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (status !== undefined) updateData.status = status;
    
    if (restaurantId !== undefined && restaurantId !== existingEvent.restaurantId) {
      updateData.restaurant = {
        connect: { id: restaurantId }
      };
    }
    
    const updatedEvent = await prisma.event.update({
      where: { id: id as string },
      data: updateData,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          }
        },
        _count: {
          select: { participants: true }
        }
      }
    });
    
    return res.status(200).json({
      ok: true,
      message: 'Event updated successfully',
      data: {
        ...updatedEvent,
        stats: {
          participantsCount: updatedEvent._count.participants,
          remainingSpots: Math.max(0, updatedEvent.maxParticipants - updatedEvent._count.participants),
          participationRate: updatedEvent.maxParticipants > 0 
            ? (updatedEvent._count.participants / updatedEvent.maxParticipants) * 100 
            : 0,
          isFull: updatedEvent._count.participants >= updatedEvent.maxParticipants,
        }
      }
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({
      ok: false,
      message: `Error updating event: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * DELETE: Löschen eines Events
 */
async function deleteEvent(req: NextApiRequest, res: NextApiResponse<EventsResponse>) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({
      ok: false,
      message: 'Missing event ID'
    });
  }
  
  try {
    // Prüfen, ob das Event existiert
    const existingEvent = await prisma.event.findUnique({
      where: { id: id as string }
    });
    
    if (!existingEvent) {
      return res.status(404).json({
        ok: false,
        message: 'Event not found'
      });
    }
    
    // Zuerst alle Teilnehmer löschen
    await prisma.eventParticipant.deleteMany({
      where: { eventId: id as string }
    });
    
    // Dann das Event löschen
    await prisma.event.delete({
      where: { id: id as string }
    });
    
    return res.status(200).json({
      ok: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({
      ok: false,
      message: `Error deleting event: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
