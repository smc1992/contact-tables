import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import prisma from '../../../lib/prisma';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const supabase = createClient({ req, res });
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const {
    name,
    email,
    phone,
    address,
    description,
    cuisine,
    openingHours,
  } = req.body;

  if (!name || !email || !phone || !address) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  try {
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: { email: email },
    });

    if (existingRestaurant) {
      return res.status(409).json({ message: 'A restaurant with this email already exists.' });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        userId: user.id,
        name,
        email,
        phone,
        address,
        description,
        cuisine,
        openingHours,
      },
    });

    res.status(201).json(restaurant);
  } catch (error) {
    console.error('Error registering restaurant:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(500).json({ message: 'Database error.', code: error.code });
    }
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
} 