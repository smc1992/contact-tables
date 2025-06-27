import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

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
    return res.status(400).json({ message: 'Restaurant-ID und Tarif-ID sind erforderlich' });
  }

  // Überprüfen, ob der Tarif gültig ist
  const validPlans = ['basic', 'standard', 'premium'];
  if (!validPlans.includes(planId)) {
    return res.status(400).json({ message: 'Ungültiger Tarif' });
  }

  try {
    // Restaurant in der Datenbank finden
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        userId: true,
        isActive: true,
        contract: {
          select: {
            id: true,
            planId: true
          }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    // Überprüfen, ob der Benutzer berechtigt ist
    if (restaurant.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    // Überprüfen, ob das Restaurant aktiv ist
    if (!restaurant.isActive) {
      return res.status(403).json({ message: 'Restaurant ist nicht aktiv. Bitte aktivieren Sie Ihr Restaurant zuerst.' });
    }

    // Überprüfen, ob der Vertrag existiert
    if (!restaurant.contract) {
      return res.status(404).json({ message: 'Kein aktiver Vertrag gefunden' });
    }

    // Überprüfen, ob der neue Tarif anders ist als der aktuelle
    if (restaurant.contract.planId === planId) {
      return res.status(200).json({ message: 'Sie nutzen diesen Tarif bereits' });
    }

    // In einer echten Implementierung würden wir hier:
    // 1. Eine Zahlungsabwicklung durchführen
    // 2. Den Vertrag in der Datenbank aktualisieren
    // 3. Eine Bestätigungs-E-Mail senden
    // Für dieses Beispiel simulieren wir die Aktualisierung

    // Aktuelles Datum und Enddatum (1 Jahr später) berechnen
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    // Preise der verschiedenen Tarife
    const prices = {
      basic: 29.99,
      standard: 49.99,
      premium: 99.99
    };

    // Simulierte Vertragsänderung
    const updatedContract = {
      id: restaurant.contract.id,
      planId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      amount: prices[planId as keyof typeof prices]
    };

    return res.status(200).json({ 
      message: 'Abonnement erfolgreich aktualisiert',
      contract: updatedContract
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Abonnements:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
