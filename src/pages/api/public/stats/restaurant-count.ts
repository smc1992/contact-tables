import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Alle Restaurants zählen
    const count = await prisma.restaurant.count();
    
    // Cache-Header setzen für bessere Performance
    res.setHeader('Cache-Control', 'public, max-age=60'); // 60 Sekunden cachen
    
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Fehler beim Abrufen der Restaurantanzahl:', error);
    return res.status(500).json({ 
      error: 'Serverfehler beim Abrufen der Restaurantanzahl',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}
