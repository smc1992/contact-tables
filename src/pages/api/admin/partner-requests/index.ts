import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authentifizierung überprüfen
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }
  
  // Überprüfen, ob der Benutzer ein Admin ist
  if (session.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Keine Berechtigung' });
  }
  
  if (req.method === 'GET') {
    try {
      // Alle Restaurants mit Status PENDING abrufen
      const restaurants = await prisma.restaurant.findMany({
        where: {
          contractStatus: 'PENDING'
        },
        include: {
          profile: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return res.status(200).json({ restaurants });
    } catch (error) {
      console.error('Fehler beim Abrufen der Partneranfragen:', error);
      return res.status(500).json({ message: 'Interner Serverfehler' });
    }
  }
  
  // Methode nicht erlaubt
  return res.status(405).json({ message: 'Methode nicht erlaubt' });
}
