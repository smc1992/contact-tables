import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const prisma = new PrismaClient();

export const createCustomer = async (email: string, name: string) => {
  const customer = await stripe.customers.create({
    email,
    name,
  });
  return customer.id;
};

export const createRestaurantSubscription = async (
  restaurantId: string,
  customerId: string,
  priceId: string
) => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      payment_method_types: ['card', 'sepa_debit', 'paypal'],
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
  });

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      stripeSubscriptionId: subscription.id,
      contractStatus: 'ACTIVE',
    },
  });

  return subscription;
};

export const createUserSubscription = async (
  userId: string,
  customerId: string,
  priceId: string
) => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      payment_method_types: ['card', 'sepa_debit', 'paypal'],
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
  });

  await prisma.profile.update({
    where: { id: userId },
    data: {
      isPaying: true,
    },
  });

  return subscription;
};

export const cancelSubscription = async (subscriptionId: string) => {
  return await stripe.subscriptions.cancel(subscriptionId);
};

export const createPaymentIntent = async (
  amount: number,
  currency: string,
  customerId: string
) => {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    payment_method_types: ['card', 'sepa_debit', 'paypal', 'klarna', 'giropay'],
  });
};

export const handleWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'invoice.paid':
      const invoice = event.data.object as Stripe.Invoice;
      // Stelle sicher, dass invoice_pdf nicht undefined ist
      const downloadUrl = invoice.invoice_pdf || '';
      // Behandle customer als string oder string[] und extrahiere einen einzelnen Wert
      const customerId = typeof invoice.customer === 'string' 
        ? invoice.customer 
        : (invoice.customer as any)?.id || '';
      
      // Stelle sicher, dass alle erforderlichen Felder vorhanden sind
      const invoiceData = {
        stripeInvoiceId: invoice.id || '', // Stelle sicher, dass id nicht undefined ist
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency || 'EUR', // Standardwährung, falls nicht definiert
        downloadUrl: downloadUrl || '',
        // Bestimme anhand der Metadaten, ob es sich um ein Restaurant oder einen Nutzer handelt
        userId: invoice.metadata?.type === 'restaurant' ? null : customerId || null,
        restaurantId: invoice.metadata?.type === 'restaurant' ? customerId || null : null,
      };
      
      await prisma.invoice.create({
        data: invoiceData
      });
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      const restaurant = await prisma.restaurant.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (restaurant) {
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: {
            contractStatus: 'CANCELLED',
            stripeSubscriptionId: null,
          },
        });
      }
      break;
  }
}; 