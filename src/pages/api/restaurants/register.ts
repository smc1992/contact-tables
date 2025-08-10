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

    // --- Automatic Geocoding Step ---
    let latitude: number | null = null;
    let longitude: number | null = null;

    try {
      const geocodingUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${process.env.OPENCAGE_API_KEY}`;
      const geoResponse = await fetch(geocodingUrl);
      const geoData = await geoResponse.json();

      if (geoData.results && geoData.results.length > 0) {
        latitude = geoData.results[0].geometry.lat;
        longitude = geoData.results[0].geometry.lng;
      } else {
        // If geocoding fails, we can either stop or allow creation without coordinates.
        // For now, we'll stop and return an error.
        return res.status(400).json({ message: 'Could not verify the address. Please provide a valid address.' });
      }
    } catch (geoError) {
      console.error('Geocoding API error during registration:', geoError);
      return res.status(500).json({ message: 'An error occurred during address verification.' });
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
        latitude,
        longitude,
        isVisible: true, // Set restaurant to visible by default
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