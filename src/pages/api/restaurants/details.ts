import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

// Definiert einen Typ für das Restaurant-Objekt mit allen Relationen
const restaurantWithDetailsInclude = {
  events: {
    where: {
      datetime: {
        gte: new Date()
      }
    },
    orderBy: {
      datetime: 'asc' as const
    },
    include: {
      _count: {
        select: {
          participants: true
        }
      },
      ratings: {
        include: {
          profile: {
            select: {
              name: true,
              id: true
            }
          }
        }
      }
    }
  },
  profile: {
    select: {
      name: true,
      id: true,
      email: true
    }
  }
};

const restaurantWithDetails = Prisma.validator<Prisma.RestaurantArgs>()({
  include: restaurantWithDetailsInclude
});

type RestaurantWithDetails = Prisma.RestaurantGetPayload<typeof restaurantWithDetails>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
      const supabase = createClient({ req, res });
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const userId = user.id;

  // GET: Restaurantdetails abrufen
    if (req.method === 'GET') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
      }

      const restaurant = await prisma.restaurant.findUnique({
        where: { id: id as string },
        include: restaurantWithDetailsInclude,
      });

      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant nicht gefunden' });
      }

      const allRatings = restaurant.events.flatMap(event => event.ratings);
      const avgRating = allRatings.length > 0
        ? allRatings.reduce((sum, rating) => sum + rating.value, 0) / allRatings.length
        : 0;

      const eventsWithAvailability = restaurant.events.map(event => {
        const availableSeats = event.maxParticipants - event._count.participants;
        return {
          ...event,
          availableSeats,
          isFull: availableSeats <= 0,
        };
      });

      const isOwner = restaurant.userId === userId;
      const { profile, ...restOfRestaurant } = restaurant;

      const sanitizedRestaurant = {
        ...restOfRestaurant,
        avgRating,
        totalRatings: allRatings.length,
        events: eventsWithAvailability,
        contractStatus: isOwner ? restaurant.contractStatus : undefined,
        contractStartDate: isOwner ? restaurant.contractStartDate : undefined,
        trialEndDate: isOwner ? restaurant.trialEndDate : undefined,
        stripeSubscriptionId: isOwner ? restaurant.stripeSubscriptionId : undefined,
        user: isOwner ? profile : (profile ? { name: profile.name, id: profile.id } : null),
      };

      return res.status(200).json(sanitizedRestaurant);
    } catch (error) {
      console.error('Fehler beim Abrufen der Restaurantdetails:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // PUT: Restaurantdetails aktualisieren (nur für Besitzer)
  if (req.method === 'PUT') {
    try {
      const { 
        id, 
        name, 
        description, 
        address, 
        city, 
        country, 
        cuisine, 
        capacity, 
        bookingUrl, 
        imageUrl,
        phone,
        email,
        website,
        openingHours,
        offerTableToday
      } = req.body;

      if (!id) {
        return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
      }

      // Überprüfen, ob das Restaurant existiert und dem Benutzer gehört
      const restaurant = await prisma.restaurant.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!restaurant) {
        return res.status(404).json({ 
          message: 'Restaurant nicht gefunden oder du bist nicht berechtigt, es zu bearbeiten' 
        });
      }

      // Restaurant aktualisieren
      const updatedRestaurant = await prisma.restaurant.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(address && { address }),
          ...(city && { city }),
          ...(country && { country }),
          ...(cuisine && { cuisine }),
          ...(capacity && { capacity: Number(capacity) }),
          ...(bookingUrl && { bookingUrl }),
          ...(imageUrl && { imageUrl }),
          ...(phone && { phone }),
          ...(email && { email }),
          ...(website && { website }),
          ...(openingHours && { openingHours }),
          ...(offerTableToday !== undefined && { offerTableToday: Boolean(offerTableToday) })
        }
      });

      return res.status(200).json({
        message: 'Restaurant erfolgreich aktualisiert',
        restaurant: updatedRestaurant
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Restaurants:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // PATCH: Sichtbarkeit des Restaurants ändern (nur für Besitzer)
  if (req.method === 'PATCH') {
    try {
      const { id, isVisible } = req.body;

      if (!id || isVisible === undefined) {
        return res.status(400).json({ 
          message: 'Restaurant-ID und Sichtbarkeitsstatus sind erforderlich' 
        });
      }

      // Überprüfen, ob das Restaurant existiert und dem Benutzer gehört
      const restaurant = await prisma.restaurant.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!restaurant) {
        return res.status(404).json({ 
          message: 'Restaurant nicht gefunden oder du bist nicht berechtigt, es zu bearbeiten' 
        });
      }

      // Sichtbarkeit aktualisieren
      const updatedRestaurant = await prisma.restaurant.update({
        where: { id },
        data: {
          isVisible: Boolean(isVisible)
        }
      });

      return res.status(200).json({
        message: `Restaurant ist jetzt ${isVisible ? 'sichtbar' : 'unsichtbar'}`,
        restaurant: updatedRestaurant
      });
    } catch (error) {
      console.error('Fehler beim Ändern der Sichtbarkeit des Restaurants:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  // Andere HTTP-Methoden nicht erlaubt
  return res.status(405).json({ message: 'Method not allowed' });
}
