import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ message: 'Nicht autorisiert' });
    }

    const token = authorization.split(' ')[1];
    const user = await prisma.user.findUnique({
      where: { id: token },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Zugriff verweigert' });
    }

    // Statistiken abrufen
    const [
      totalUsers,
      totalRestaurants,
      totalEvents,
      recentEvents,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.restaurant.count(),
      prisma.event.count(),
      prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: true,
          participants: true,
        },
      }),
    ]);

    return res.status(200).json({
      stats: {
        totalUsers,
        totalRestaurants,
        totalEvents,
      },
      recentEvents,
    });
  } catch (error) {
    console.error('Admin Dashboard Fehler:', error);
    return res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
  } finally {
    await prisma.$disconnect();
  }
} 