import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil' as any // Aktualisierte API-Version
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Supabase-Client erstellen
    const supabase = createPagesServerClient({ req, res });
    
    // Authentifizierung prüfen
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    // Benutzer abrufen
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Daten aus dem Request-Body extrahieren
    const { plan } = req.body;

    if (!plan || (plan !== 'user' && plan !== 'restaurant')) {
      return res.status(400).json({ message: 'Ungültiger Plan' });
    }

    // Preis-ID basierend auf dem Plan auswählen
    const priceId = plan === 'restaurant'
      ? process.env.STRIPE_RESTAURANT_PRICE_ID
      : process.env.STRIPE_USER_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ message: 'Preis-ID nicht konfiguriert' });
    }

    // Stripe Checkout-Session erstellen
    // @ts-ignore - Die Stripe-Typen stimmen nicht mit der aktuellen API-Version überein
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel`,
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        plan
      }
    });

    return res.status(200).json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Checkout-Session:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
