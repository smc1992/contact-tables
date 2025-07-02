import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-05-28.basil' });

// Mapping internal plan IDs to Stripe Price IDs
const getPriceIdForPlan = (planId: string): string | null => {
  switch (planId) {
    case 'basic':
      return process.env.STRIPE_BASIC_PLAN_PRICE_ID!;
    case 'standard':
      return process.env.STRIPE_STANDARD_PLAN_PRICE_ID!;
    case 'premium':
      return process.env.STRIPE_PREMIUM_PLAN_PRICE_ID!;
    default:
      return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { restaurantId, planId } = req.body;
  const priceId = getPriceIdForPlan(planId);

  if (!restaurantId || !priceId) {
    return res.status(400).json({ message: 'Restaurant ID and a valid Plan ID are required' });
  }

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        profile: true, // Correct relation: profile
      },
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.userId !== user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let stripeCustomerId = restaurant.profile.stripeCustomerId;

    // Create a Stripe customer if one doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: restaurant.profile.name || undefined,
        metadata: {
          userId: restaurant.userId,
        },
      });
      stripeCustomerId = customer.id;

      await prisma.profile.update({
        where: { id: restaurant.userId },
        data: { stripeCustomerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card', 'sofort', 'giropay'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/restaurant/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/restaurant/dashboard?payment=cancelled`,
      subscription_data: {
        metadata: {
          userId: restaurant.userId,
          restaurantId: restaurant.id,
          planId: planId,
        },
      },
    });

    if (!checkoutSession.url) {
        return res.status(500).json({ message: 'Failed to create Stripe checkout session.' });
    }

    return res.status(200).json({ checkoutUrl: checkoutSession.url });

  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
