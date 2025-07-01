import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Zähle die Anzahl der Benutzer
    const usersCount = await prisma.user.count({
      where: { role: 'USER' },
    });

    // Zähle die Anzahl der Restaurants
    const restaurantsCount = await prisma.restaurant.count();

    // Zähle die Anzahl der Events
    const eventsCount = await prisma.event.count();

    // Zähle die Anzahl der aktiven Abonnements
    const activeSubscriptionsCount = await prisma.profile.count({
      where: {
        isPaying: true,
      },
    });

    res.status(200).json({
      users: usersCount,
      restaurants: restaurantsCount,
      events: eventsCount,
      activeSubscriptions: activeSubscriptionsCount,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
  } finally {
    await prisma.$disconnect();
  }
} 