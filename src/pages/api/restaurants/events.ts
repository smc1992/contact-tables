import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: 'Nicht autorisiert' });
  }

  const token = authorization.split(' ')[1];
  const user = await prisma.profile.findUnique({
    where: { id: token },
    select: { role: true, restaurantId: true },
  });

  if (!user || user.role !== 'RESTAURANT') {
    return res.status(403).json({ message: 'Zugriff verweigert' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const events = await prisma.event.findMany({
          where: { restaurantId: user.restaurantId },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { date: 'asc' },
        });

        return res.status(200).json(events);
      } catch (error) {
        console.error('Fehler beim Abrufen der Events:', error);
        return res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }

    case 'POST':
      try {
        const { title, description, date, maxParticipants, price } = req.body;

        const event = await prisma.event.create({
          data: {
            title,
            description,
            date: new Date(date),
            maxParticipants,
            price,
            restaurantId: user.restaurantId!,
          },
        });

        return res.status(201).json(event);
      } catch (error) {
        console.error('Fehler beim Erstellen des Events:', error);
        return res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
} 