import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../middleware/withAdminAuth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ParticipantsResponse {
  ok: boolean;
  message?: string;
  data?: any;
}

/**
 * API-Route für die Verwaltung von Event-Teilnehmern durch Administratoren
 * 
 * Diese Route ermöglicht es Administratoren, Teilnehmer zu Events hinzuzufügen,
 * zu entfernen und alle Teilnehmer eines Events abzurufen.
 * 
 * URL-Parameter:
 * - eventId: ID des Events
 */
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ParticipantsResponse>,
  userId: string
) {
  const { eventId } = req.query;
  
  if (!eventId) {
    return res.status(400).json({
      ok: false,
      message: 'Missing event ID'
    });
  }
  
  try {
    // Prüfen, ob das Event existiert
    const event = await prisma.event.findUnique({
      where: { id: eventId as string },
      include: {
        _count: {
          select: { participants: true }
        }
      }
    });
    
    if (!event) {
      return res.status(404).json({
        ok: false,
        message: 'Event not found'
      });
    }
    
    switch (req.method) {
      case 'GET':
        return await getParticipants(req, res, eventId as string);
      case 'POST':
        return await addParticipant(req, res, eventId as string, event);
      case 'DELETE':
        return await removeParticipant(req, res, eventId as string);
      default:
        return res.status(405).json({ ok: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in event participants API:', error);
    return res.status(500).json({
      ok: false,
      message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * GET: Abrufen aller Teilnehmer eines Events
 */
async function getParticipants(
  req: NextApiRequest,
  res: NextApiResponse<ParticipantsResponse>,
  eventId: string
) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 50;
  const search = req.query.search as string;
  
  const skip = (page - 1) * pageSize;
  
  // Erstelle die Filterbedingungen
  const where: any = { eventId };
  
  // Suchfilter für Teilnehmer
  if (search) {
    where.profile = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    };
  }
  
  try {
    // Abfrage der Teilnehmer mit Filtern
    const [participants, totalCount] = await Promise.all([
      prisma.eventParticipant.findMany({
        where,
        include: {
          profile: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              user_metadata: true,
              created_at: true,
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.eventParticipant.count({ where }),
    ]);
    
    return res.status(200).json({
      ok: true,
      message: 'Participants retrieved successfully',
      data: {
        participants,
        pagination: {
          total: totalCount,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
        }
      }
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return res.status(500).json({
      ok: false,
      message: `Error fetching participants: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * POST: Hinzufügen eines Teilnehmers zu einem Event
 */
async function addParticipant(
  req: NextApiRequest,
  res: NextApiResponse<ParticipantsResponse>,
  eventId: string,
  event: any
) {
  const { userId, notes } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      ok: false,
      message: 'Missing user ID'
    });
  }
  
  try {
    // Prüfen, ob der Benutzer existiert
    const user = await prisma.profile.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: 'User not found'
      });
    }
    
    // Prüfen, ob der Benutzer bereits Teilnehmer ist
    const existingParticipant = await prisma.eventParticipant.findFirst({
      where: {
        eventId,
        userId
      }
    });
    
    if (existingParticipant) {
      return res.status(409).json({
        ok: false,
        message: 'User is already a participant of this event'
      });
    }
    
    // Prüfen, ob das Event noch Platz hat
    if (event._count.participants >= event.maxParticipants) {
      return res.status(400).json({
        ok: false,
        message: 'Event is already full'
      });
    }
    
    // Teilnehmer hinzufügen
    const participant = await prisma.eventParticipant.create({
      data: {
        event: {
          connect: { id: eventId }
        },
        profile: {
          connect: { id: userId }
        },
        notes: notes || null,
        status: 'confirmed',
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    return res.status(201).json({
      ok: true,
      message: 'Participant added successfully',
      data: participant
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    return res.status(500).json({
      ok: false,
      message: `Error adding participant: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * DELETE: Entfernen eines Teilnehmers von einem Event
 */
async function removeParticipant(
  req: NextApiRequest,
  res: NextApiResponse<ParticipantsResponse>,
  eventId: string
) {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      ok: false,
      message: 'Missing user ID'
    });
  }
  
  try {
    // Prüfen, ob der Teilnehmer existiert
    const participant = await prisma.eventParticipant.findFirst({
      where: {
        eventId,
        userId: userId as string
      }
    });
    
    if (!participant) {
      return res.status(404).json({
        ok: false,
        message: 'Participant not found'
      });
    }
    
    // Teilnehmer entfernen
    await prisma.eventParticipant.delete({
      where: {
        id: participant.id
      }
    });
    
    return res.status(200).json({
      ok: true,
      message: 'Participant removed successfully'
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    return res.status(500).json({
      ok: false,
      message: `Error removing participant: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
