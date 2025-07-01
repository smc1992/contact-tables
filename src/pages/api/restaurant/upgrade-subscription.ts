import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-05-28.basil' });

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

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { restaurantId, newPlanId } = req.body;
  const newPriceId = getPriceIdForPlan(newPlanId);

  if (!restaurantId || !newPriceId) {
    return res.status(400).json({ message: 'Restaurant ID and a valid new Plan ID are required' });
  }

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        profile: true,
        contract: true, // Correct: 1-to-1 relation
      },
    });

    if (!restaurant || restaurant.userId !== session.user.id) {
      return res.status(404).json({ message: 'Active restaurant not found for this user.' });
    }

    if (!restaurant.contract || restaurant.contract.status !== 'ACTIVE' || !restaurant.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription found to upgrade.' });
    }

    if (restaurant.plan === newPlanId) {
        return res.status(400).json({ message: 'This is already your current plan.' });
    }

    // Retrieve the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(restaurant.stripeSubscriptionId);

    // Update the subscription in Stripe
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    });

    // Update the restaurant plan in the local database
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        plan: newPlanId,
      },
    });

    return res.status(200).json({ 
      message: 'Subscription upgraded successfully.',
      restaurant: updatedRestaurant 
    });

  } catch (error: any) {
    console.error('Error upgrading subscription:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
