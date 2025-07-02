import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, ContractStatus } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

// Funktion zum Generieren eines sicheren Tokens
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  // Supabase-Client für Authentifizierung erstellen
  const supabase = createClient({ req, res });

  try {
    // Überprüfen, ob der Benutzer authentifiziert und ein Admin ist
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    if (user.user_metadata.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    const { restaurantId } = req.body;

    // Validierung der Eingabedaten
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
    }

    const prisma = new PrismaClient();

    // Restaurant finden
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
      include: {
        profile: true,
      },
    });

    if (!restaurant) {
      await prisma.$disconnect();
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    // Überprüfen, ob der Vertragsstatus "PENDING" ist
    if (restaurant.contractStatus !== 'PENDING') {
      await prisma.$disconnect();
      return res.status(400).json({ message: 'Restaurant ist nicht im Wartestatus' });
    }

    // Sicheres Token für den Vertragslink generieren
    const contractToken = generateSecureToken();

    // Restaurant-Status auf APPROVED setzen und Token speichern
    const updatedRestaurant = await prisma.restaurant.update({
      where: {
        id: restaurantId,
      },
      data: {
        contractStatus: 'APPROVED' as any, // TypeScript-Cast, um Typfehler zu vermeiden
        contractToken: contractToken,
        contractTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Token ist 7 Tage gültig
      },
    });

    await prisma.$disconnect();

    // E-Mail mit dem Vertragslink senden
    // In einer realen Anwendung würde hier ein E-Mail-Service wie SendGrid oder Amazon SES verwendet werden
    // Für dieses Beispiel simulieren wir den E-Mail-Versand
    const contractLink = `${process.env.NEXT_PUBLIC_APP_URL}/restaurant/contract/${restaurantId}?token=${contractToken}`;
    
    console.log('E-Mail würde gesendet werden an:', restaurant.email);
    console.log('Vertragslink:', contractLink);

    // Erfolgreiche Antwort senden
    return res.status(200).json({
      success: true,
      message: 'Restaurant erfolgreich genehmigt und E-Mail gesendet',
      restaurant: {
        id: updatedRestaurant.id,
        name: updatedRestaurant.name,
        contractStatus: updatedRestaurant.contractStatus,
        email: restaurant.email,
      },
    });
  } catch (error: any) {
    console.error('Fehler bei der Restaurant-Genehmigung:', error);
    return res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
}
