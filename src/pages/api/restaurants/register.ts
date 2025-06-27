import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      name,
      email,
      phone,
      address,
      description,
      cuisine,
      capacity,
      openingHours,
    } = req.body;

    // Validierung
    if (!name || !email || !phone || !address || !description || !cuisine || !capacity || !openingHours) {
      return res.status(400).json({ message: 'Alle Felder sind erforderlich' });
    }

    // Prüfe, ob Restaurant mit dieser E-Mail bereits existiert
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { email },
    });

    if (existingRestaurant) {
      return res.status(400).json({ message: 'Ein Restaurant mit dieser E-Mail existiert bereits' });
    }

    // Erstelle neues Restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        email,
        phone,
        address,
        description,
        cuisine,
        capacity: parseInt(capacity),
        openingHours,
        status: 'PENDING', // Restaurant muss erst von Admin freigegeben werden
      },
    });

    // Erfolgreiche Antwort
    res.status(201).json({
      message: 'Restaurant erfolgreich registriert',
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
      },
    });
  } catch (error) {
    console.error('Error registering restaurant:', error);
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
  } finally {
    await prisma.$disconnect();
  }
} 