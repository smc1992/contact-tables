import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Supabase Admin client for elevated privileges
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated. Please log in to become a partner.' });
  }

  const {
    restaurantName,
    address,
    city,
    postalCode,
    country,
    phone,
    email, // This is the restaurant's public email, not the user's auth email
    website,
    description,
    cuisine,
    capacity,
    openingHours
  } = req.body;

  if (!restaurantName || !address || !city || !postalCode || !phone || !email) {
    return res.status(400).json({ message: 'Please fill out all required fields.' });
  }

  const userId = session.user.id;

  try {
    // Check if the user already has a restaurant
    const userHasRestaurant = await prisma.restaurant.findUnique({
      where: { userId: userId },
    });

    if (userHasRestaurant) {
      return res.status(409).json({ message: 'You already have a registered restaurant.' });
    }

    // Check if a restaurant with this public email already exists
    const emailInUse = await prisma.restaurant.findFirst({
        where: { email: email },
    });

    if(emailInUse) {
        return res.status(409).json({ message: 'A restaurant with this email address already exists.' });
    }

    // Use a transaction to create the restaurant
    const restaurant = await prisma.$transaction(async (tx) => {
      const newRestaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          address,
          city,
          postal_code: postalCode,
          country,
          phone,
          email,
          website: website || null,
          description: description || null,
          cuisine: cuisine || null,
          capacity: capacity ? parseInt(capacity) : null,
          openingHours: openingHours || null,
          contractStatus: 'PENDING',
          userId: userId,
        },
      });

      // The user's role will be updated in Supabase Auth, which is the source of truth.
      // A database trigger is expected to sync this change to the public.profiles table.

      return newRestaurant;
    });

    // Update the user's role in Supabase Auth (source of truth)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { ...session.user.user_metadata, role: 'RESTAURANT' } }
    );

    if (updateError) {
      console.error('CRITICAL: Failed to update user role in Supabase Auth after creating restaurant:', updateError);
    }

    return res.status(201).json({
      message: 'Partner request successful! Your restaurant has been created.',
      restaurantId: restaurant.id,
    });
  } catch (error: any) {
    console.error('Error processing partner request:', error);
    return res.status(500).json({ message: 'An error occurred. Please try again later.' });
  } finally {
    await prisma.$disconnect();
  }
}
