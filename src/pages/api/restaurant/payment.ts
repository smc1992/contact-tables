import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../../../utils/emailService';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  // Authentifizierung überprüfen
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const { restaurantId, planId } = req.body;

  if (!restaurantId || !planId) {
    return res.status(400).json({ message: 'Restaurant-ID und Plan-ID sind erforderlich' });
  }

  try {
    // Restaurant in der Datenbank finden
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    // Überprüfen, ob der Benutzer berechtigt ist
    if (restaurant.user.id !== session.user.id && session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    if (restaurant.contractStatus !== 'APPROVED') {
      return res.status(400).json({ message: 'Restaurant ist nicht im Status APPROVED' });
    }

    // In einer echten Anwendung würde hier die Stripe-Integration erfolgen
    // Hier simulieren wir eine erfolgreiche Zahlung

    // Rechnung erstellen
    const invoice = await prisma.invoice.create({
      data: {
        restaurantId: restaurantId,
        amount: getPlanAmount(planId),
        status: 'PAID',
        description: `Abonnement ${getPlanName(planId)} - Monatliche Gebühr`,
        paymentMethod: 'CREDIT_CARD'
      }
    });

    // Vertrag erstellen
    const contract = await prisma.contract.create({
      data: {
        restaurantId: restaurantId,
        planId: planId,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 Monat Laufzeit
        autoRenew: true
      }
    });

    // Restaurant-Status auf ACTIVE aktualisieren
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        contractStatus: 'ACTIVE',
        isActive: true
      }
    });

    // Bestätigungs-E-Mail senden
    await sendEmail({
      to: restaurant.user.email,
      subject: 'Willkommen bei Contact Tables - Ihr Restaurant ist jetzt aktiv!',
      html: `
        <h1>Herzlichen Glückwunsch!</h1>
        <p>Liebe(r) ${restaurant.user.name},</p>
        <p>wir freuen uns, Ihnen mitteilen zu können, dass Ihr Restaurant "${restaurant.name}" jetzt aktiv auf Contact Tables ist!</p>
        <p>Ihre Zahlung wurde erfolgreich verarbeitet und Ihr Vertrag ist aktiv.</p>
        <p><strong>Abonnement:</strong> ${getPlanName(planId)}</p>
        <p><strong>Monatliche Gebühr:</strong> ${getPlanAmount(planId)} €</p>
        <p>Sie können jetzt Ihr Restaurant-Profil verwalten, Bilder hochladen und Ihre Contact Tables einrichten.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/restaurant/dashboard" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px;">Zum Restaurant-Dashboard</a></p>
        <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
        <p>Mit freundlichen Grüßen,<br>Ihr Contact Tables Team</p>
      `
    });

    return res.status(200).json({ 
      message: 'Zahlung erfolgreich verarbeitet',
      invoice: invoice.id,
      contract: contract.id
    });
  } catch (error) {
    console.error('Fehler bei der Zahlungsverarbeitung:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}

// Hilfsfunktionen für Plan-Informationen
function getPlanAmount(planId: string): number {
  switch (planId) {
    case 'basic':
      return 49;
    case 'standard':
      return 89;
    case 'premium':
      return 149;
    default:
      return 89; // Standard als Fallback
  }
}

function getPlanName(planId: string): string {
  switch (planId) {
    case 'basic':
      return 'Basic';
    case 'standard':
      return 'Standard';
    case 'premium':
      return 'Premium';
    default:
      return 'Standard'; // Standard als Fallback
  }
}
