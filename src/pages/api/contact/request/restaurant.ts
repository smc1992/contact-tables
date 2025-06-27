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
  
  // Überprüfen, ob der Benutzer ein Restaurant ist
  const user = await prisma.profile.findUnique({
    where: { id: userId },
    include: {
      restaurant: true
    }
  });
  
  if (!user || user.role !== 'RESTAURANT' || !user.restaurant) {
    return res.status(403).json({ message: 'Nur Restaurant-Benutzer können auf diese Ressource zugreifen' });
  }

  const restaurantId = user.restaurant.id;

  // GET: Kontakttische für das Restaurant abrufen
  if (req.method === 'GET') {
    try {
      const { date } = req.query;
      
      // Filter für das Datum erstellen
      let dateFilter = {};
      if (date && typeof date === 'string') {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        dateFilter = {
          datetime: {
            gte: startDate,
            lte: endDate
          }
        };
      }
      
      // Kontakttische abrufen
      const contactTables = await prisma.event.findMany({
        where: {
          restaurantId,
          ...dateFilter
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
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
        }
      });
      
      // Daten für die Antwort aufbereiten
      const formattedTables = contactTables.map(table => {
        const availableSeats = table.maxParticipants - table._count.participants;
        const isPast = new Date(table.datetime) < new Date();
        
        let status: 'OPEN' | 'FULL' | 'PAST' = 'OPEN';
        if (isPast) {
          status = 'PAST';
        } else if (availableSeats <= 0) {
          status = 'FULL';
        }
        
        return {
          ...table,
          availableSeats,
          status,
          isPast
        };
      });
      
      return res.status(200).json({ 
        message: 'Kontakttische erfolgreich abgerufen',
        contactTables: formattedTables
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Kontakttische:', error);
      return res.status(500).json({ message: 'Interner Serverfehler' });
    }
  }
  
  // Andere HTTP-Methoden werden nicht unterstützt
  return res.status(405).json({ message: 'Methode nicht erlaubt' });
}
