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

  // POST: Neue Bewertung erstellen
  if (req.method === 'POST') {
    try {
      const { restaurantId, value, comment } = req.body;

      // Validierung
      if (!restaurantId || !value || value < 1 || value > 5) {
        return res.status(400).json({ 
          message: 'Restaurantid und gültige Bewertung (1-5) sind erforderlich' 
        });
      }

      // Überprüfen, ob das Restaurant existiert
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });

      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant nicht gefunden' });
      }

      // Überprüfen, ob der Benutzer bereits eine Bewertung abgegeben hat
      const existingRating = await prisma.rating.findFirst({
        where: {
          userId,
          restaurantId
        }
      });

      if (existingRating) {
        return res.status(400).json({ 
          message: 'Du hast dieses Restaurant bereits bewertet',
          existingRating
        });
      }

      // Neue Bewertung erstellen
      const newRating = await prisma.rating.create({
        data: {
          value: Number(value),
          comment,
          user: {
            connect: { id: userId }
          },
          restaurant: {
            connect: { id: restaurantId }
          }
        },
        include: {
          user: {
            select: {
              name: true,
              id: true
            }
          },
          restaurant: {
            select: {
              name: true,
              id: true
            }
          }
        }
      });

      // Benachrichtigung an den Restaurantbesitzer senden
      if (restaurant.userId) {
        await prisma.notification.create({
          data: {
            userId: restaurant.userId,
            title: 'Neue Bewertung für dein Restaurant',
            message: `${session.user.name} hat dein Restaurant "${restaurant.name}" mit ${value} Sternen bewertet.`,
            type: 'RESTAURANT_RATING',
            read: false,
            data: JSON.stringify({
              restaurantId,
              ratingId: newRating.id,
              value
            })
          }
        });
      }

      return res.status(201).json({
        message: 'Bewertung erfolgreich erstellt',
        rating: newRating
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der Bewertung:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // PUT: Bewertung aktualisieren
  if (req.method === 'PUT') {
    try {
      const { ratingId, value, comment } = req.body;

      if (!ratingId || !value || value < 1 || value > 5) {
        return res.status(400).json({ 
          message: 'Bewertungs-ID und gültige Bewertung (1-5) sind erforderlich' 
        });
      }

      // Überprüfen, ob die Bewertung existiert und dem Benutzer gehört
      const rating = await prisma.rating.findFirst({
        where: {
          id: ratingId,
          userId
        },
        include: {
          restaurant: true
        }
      });

      if (!rating) {
        return res.status(404).json({ message: 'Bewertung nicht gefunden oder nicht berechtigt' });
      }

      // Bewertung aktualisieren
      const updatedRating = await prisma.rating.update({
        where: { id: ratingId },
        data: {
          value: Number(value),
          comment
        },
        include: {
          user: {
            select: {
              name: true,
              id: true
            }
          },
          restaurant: {
            select: {
              name: true,
              id: true
            }
          }
        }
      });

      return res.status(200).json({
        message: 'Bewertung erfolgreich aktualisiert',
        rating: updatedRating
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Bewertung:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // DELETE: Bewertung löschen
  if (req.method === 'DELETE') {
    try {
      const { ratingId } = req.body;

      if (!ratingId) {
        return res.status(400).json({ message: 'Bewertungs-ID ist erforderlich' });
      }

      // Überprüfen, ob die Bewertung existiert und dem Benutzer gehört
      const rating = await prisma.rating.findFirst({
        where: {
          id: ratingId,
          userId
        }
      });

      if (!rating) {
        return res.status(404).json({ message: 'Bewertung nicht gefunden oder nicht berechtigt' });
      }

      // Bewertung löschen
      await prisma.rating.delete({
        where: { id: ratingId }
      });

      return res.status(200).json({
        message: 'Bewertung erfolgreich gelöscht'
      });
    } catch (error) {
      console.error('Fehler beim Löschen der Bewertung:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // GET: Bewertungen für ein Restaurant abrufen
  if (req.method === 'GET') {
    try {
      const { restaurantId } = req.query;

      if (!restaurantId) {
        return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
      }

      // Überprüfen, ob das Restaurant existiert
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId as string }
      });

      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant nicht gefunden' });
      }

      // Bewertungen abrufen
      const ratings = await prisma.rating.findMany({
        where: {
          restaurantId: restaurantId as string
        },
        include: {
          user: {
            select: {
              name: true,
              id: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Durchschnittliche Bewertung berechnen
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating.value, 0) / ratings.length
        : 0;

      return res.status(200).json({
        ratings,
        averageRating,
        totalRatings: ratings.length
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Bewertungen:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // Andere HTTP-Methoden nicht erlaubt
  return res.status(405).json({ message: 'Method not allowed' });
}
