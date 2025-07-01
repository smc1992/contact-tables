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

    const { restaurantId, title, description, date, time, maxParticipants, price = 0 } = req.body;

    if (!restaurantId || !title || !date || !time || !maxParticipants) {
      return res.status(400).json({ 
        message: 'Fehlende Pflichtfelder', 
        requiredFields: ['restaurantId', 'title', 'date', 'time', 'maxParticipants'] 
      });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    const datetime = new Date(`${date}T${time}`);
    
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        datetime,
        maxParticipants: Number(maxParticipants),
        price: Number(price),
        restaurant: {
          connect: { id: restaurantId }
        },
        participants: {
          create: {
            profile: { // Corrected from 'user' to 'profile'
              connect: { id: session.user.id }
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
            id: true
          }
        },
        participants: {
          include: {
            profile: { // Corrected from 'user' to 'profile'
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
      message: 'Event erfolgreich erstellt',
      event: newEvent
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Events:', error);
    return res.status(500).json({ 
      message: 'Interner Serverfehler', 
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
    });
  }
}
