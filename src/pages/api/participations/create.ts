import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { createServerClient } from '@supabase/ssr';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Hole Access-Token aus Authorization-Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        debug: { authError: 'Missing or invalid Authorization header' }
      });
    }

    const accessToken = authHeader.substring(7); // Entferne "Bearer "
    
    // Erstelle Supabase-Client mit Access-Token
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        debug: {
          authError: authError?.message,
          hasUser: !!user,
          userId: user?.id || null
        }
      });
    }

    const { event_id, message, reservation_date } = req.body;

    if (!event_id) {
      return res.status(400).json({ error: 'event_id is required' });
    }

    // Erstelle die Teilnahme direkt mit Prisma (umgeht Supabase RLS)
    console.log('Creating participation with data:', {
      eventId: event_id,
      userId: user.id,
      message: message || null,
      reservationDate: reservation_date,
    });
    
    const participation = await prisma.eventParticipant.create({
      data: {
        id: uuidv4(),
        eventId: event_id,
        userId: user.id,
        message: message || null,
        reservationDate: reservation_date ? new Date(reservation_date) : null,
        isHost: false,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('Participation created successfully:', participation);
    return res.status(200).json({ success: true, participation });
  } catch (error: any) {
    console.error('Error creating participation:', error);
    
    // Duplicate entry (Prisma error code P2002)
    if (error.code === 'P2002') {
      return res.status(200).json({ success: true, message: 'Du nimmst bereits an diesem Termin teil.' });
    }

    return res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
