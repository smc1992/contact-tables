import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil' as any
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or Service Role Key is not defined. Webhook may fail.');
}
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!);

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

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase environment variables are not set for webhook handler.');
    return res.status(500).json({ message: 'Server configuration error.' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;

    if (!sig || !webhookSecret) {
      return res.status(400).json({ message: 'Webhook-Signatur oder Secret fehlt' });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook-Fehler: ${err.message}`);
      return res.status(400).json({ message: `Webhook-Fehler: ${err.message}` });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (!session.metadata?.userId || !session.metadata?.plan) {
          console.error('Fehlende Metadaten in der Checkout-Session');
          return res.status(400).json({ message: 'Fehlende Metadaten' });
        }

        const { userId, plan } = session.metadata;
        const isPaying = true;

        if (plan === 'user') {
          await prisma.profile.update({
            where: { id: userId },
            data: {
              isPaying,
              stripeCustomerId: session.customer as string,
              updatedAt: new Date()
            }
          });
        } else if (plan === 'restaurant') {
          const user = await prisma.profile.findUnique({
            where: { id: userId },
            include: { restaurant: true }
          });

          if (!user) {
            console.error('Benutzer nicht gefunden');
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
          }

          // Update user profile in public schema
          await prisma.profile.update({
            where: { id: userId },
            data: {
              isPaying,
              stripeCustomerId: session.customer as string,
              updatedAt: new Date()
            }
          });
          
          // Update user role in Supabase Auth
          const { error: adminUserError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { user_metadata: { role: 'RESTAURANT' } }
          );

          if (adminUserError) {
            console.error(`Fehler beim Aktualisieren der Supabase Benutzerrolle für Benutzer ${userId}:`, adminUserError);
          }

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
                email: session.customer_details?.email || '',
                isVisible: false,
                contractStatus: 'ACTIVE',
                profile: {
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

        const user = await prisma.profile.findFirst({
          where: { stripeCustomerId: customerId }
        });

        if (!user) {
          console.error('Benutzer mit dieser Kunden-ID nicht gefunden');
          return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        await prisma.profile.update({
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

        const user = await prisma.profile.findFirst({
          where: { stripeCustomerId: customerId }
        });

        if (!user) {
          console.error('Benutzer mit dieser Kunden-ID nicht gefunden');
          return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        await prisma.profile.update({
          where: { id: user.id },
          data: {
            isPaying: false,
            updatedAt: new Date()
          }
        });

        // Get user role from Supabase Auth
        const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(user.id);

        if (authUserError) {
          console.error(`Konnte Benutzer ${user.id} nicht von Supabase Auth abrufen:`, authUserError);
        }

        if (authUser?.user?.user_metadata?.role === 'RESTAURANT') {
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
  } finally {
      await prisma.$disconnect();
  }
}
