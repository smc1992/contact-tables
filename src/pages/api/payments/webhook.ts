import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

// Webhook-Signatur überprüfen
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Raw-Body-Parser für Stripe-Webhooks aktivieren
export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;

    if (!sig || !webhookSecret) {
      return res.status(400).json({ message: 'Webhook-Signatur oder Secret fehlt' });
    }

    // Stripe-Event verifizieren
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook-Fehler: ${err.message}`);
      return res.status(400).json({ message: `Webhook-Fehler: ${err.message}` });
    }

    // Event-Typ verarbeiten
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (!session.metadata?.userId || !session.metadata?.plan) {
          console.error('Fehlende Metadaten in der Checkout-Session');
          return res.status(400).json({ message: 'Fehlende Metadaten' });
        }

        const { userId, plan } = session.metadata;
        const isPaying = true;

        // Benutzer aktualisieren
        if (plan === 'user') {
          await prisma.user.update({
            where: { id: userId },
            data: {
              isPaying,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              updatedAt: new Date()
            }
          });
        } else if (plan === 'restaurant') {
          // Wenn der Benutzer ein Restaurant-Abonnement abschließt, 
          // müssen wir prüfen, ob bereits ein Restaurant existiert
          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { restaurant: true }
          });

          if (!user) {
            console.error('Benutzer nicht gefunden');
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
          }

          // Benutzer aktualisieren
          await prisma.user.update({
            where: { id: userId },
            data: {
              isPaying,
              role: 'RESTAURANT',
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              updatedAt: new Date()
            }
          });

          // Wenn noch kein Restaurant existiert, eines erstellen
          if (!user.restaurant) {
            await prisma.restaurant.create({
              data: {
                name: `Restaurant von ${user.name || 'Benutzer'}`,
                description: 'Keine Beschreibung vorhanden',
                address: '',
                city: '',
                postalCode: '',
                country: 'DE',
                phone: '',
                email: user.email || '',
                isVisible: false,
                contractStatus: 'ACTIVE',
                user: {
                  connect: { id: userId }
                },
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          }
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;
        const customerId = subscription.customer as string;

        // Benutzer mit dieser Kunden-ID finden
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId }
        });

        if (!user) {
          console.error('Benutzer mit dieser Kunden-ID nicht gefunden');
          return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        // Abonnementstatus aktualisieren
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isPaying: status === 'active',
            updatedAt: new Date()
          }
        });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Benutzer mit dieser Kunden-ID finden
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId }
        });

        if (!user) {
          console.error('Benutzer mit dieser Kunden-ID nicht gefunden');
          return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        // Abonnement als gekündigt markieren
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isPaying: false,
            updatedAt: new Date()
          }
        });

        // Wenn es ein Restaurant-Benutzer ist, den Vertragsstatus aktualisieren
        if (user.role === 'RESTAURANT') {
          await prisma.restaurant.updateMany({
            where: { userId: user.id },
            data: {
              contractStatus: 'CANCELLED',
              updatedAt: new Date()
            }
          });
        }

        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Fehler bei der Verarbeitung des Webhooks:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
