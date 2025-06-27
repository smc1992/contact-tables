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

  // GET: Favorisierte Restaurants abrufen
  if (req.method === 'GET') {
    try {
      // Benutzer mit seinen favorisierten Restaurants abrufen
      const favorites = await prisma.favorite.findMany({
        where: { userId: userId },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              cuisine: true,
              imageUrl: true,
              ratings: true
            }
          }
        }
      });

      if (!favorites || favorites.length === 0) {
        return res.status(200).json([]); // Leere Liste zurückgeben, wenn keine Favoriten gefunden wurden
      }

      // Durchschnittliche Bewertungen berechnen
      const restaurantsWithRatings = favorites.map(favorite => {
        const restaurant = favorite.restaurant;
        const avgRating = restaurant.ratings.length > 0
          ? restaurant.ratings.reduce((sum, rating) => sum + rating.value, 0) / restaurant.ratings.length
          : 0;
        
        return {
          ...restaurant,
          avgRating,
          totalRatings: restaurant.ratings.length,
          // Entferne die einzelnen Bewertungen aus der Antwort
          ratings: undefined
        };
      });

      return res.status(200).json(restaurantsWithRatings);
    } catch (error) {
      console.error('Fehler beim Abrufen der favorisierten Restaurants:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // POST: Restaurant zu Favoriten hinzufügen
  if (req.method === 'POST') {
    try {
      const { restaurantId } = req.body;

      if (!restaurantId) {
        return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
      }

      // Überprüfen, ob das Restaurant existiert
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });

      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant nicht gefunden' });
      }

      // Überprüfen, ob das Restaurant bereits favorisiert ist
      const existingFavorite = await prisma.favorite.findUnique({
        where: {
          userId_restaurantId: {
            userId: userId,
            restaurantId: restaurantId
          }
        }
      });

      if (existingFavorite) {
        return res.status(400).json({ message: 'Restaurant ist bereits favorisiert' });
      }

      // Restaurant zu Favoriten hinzufügen
      await prisma.favorite.create({
        data: {
          user: {
            connect: { id: userId }
          },
          restaurant: {
            connect: { id: restaurantId }
          }
        }
      });

      return res.status(200).json({
        message: 'Restaurant erfolgreich zu Favoriten hinzugefügt'
      });
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Restaurants zu Favoriten:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // DELETE: Restaurant aus Favoriten entfernen
  if (req.method === 'DELETE') {
    try {
      const { restaurantId } = req.body;

      if (!restaurantId) {
        return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
      }

      // Überprüfen, ob das Restaurant favorisiert ist
      const existingFavorite = await prisma.favorite.findUnique({
        where: {
          userId_restaurantId: {
            userId: userId,
            restaurantId: restaurantId
          }
        }
      });

      if (!existingFavorite) {
        return res.status(400).json({ message: 'Restaurant ist nicht favorisiert' });
      }

      // Restaurant aus Favoriten entfernen
      await prisma.favorite.delete({
        where: {
          userId_restaurantId: {
            userId: userId,
            restaurantId: restaurantId
          }
        }
      });

      return res.status(200).json({
        message: 'Restaurant erfolgreich aus Favoriten entfernt'
      });
    } catch (error) {
      console.error('Fehler beim Entfernen des Restaurants aus Favoriten:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // Andere HTTP-Methoden nicht erlaubt
  return res.status(405).json({ message: 'Method not allowed' });
}
