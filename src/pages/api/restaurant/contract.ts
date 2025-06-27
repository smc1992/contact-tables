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

  const { restaurantId, planId, acceptedTerms } = req.body;

  if (!restaurantId || !planId) {
    return res.status(400).json({ message: 'Restaurant-ID und Plan-ID sind erforderlich' });
  }

  if (!acceptedTerms) {
    return res.status(400).json({ message: 'Die Nutzungsbedingungen müssen akzeptiert werden' });
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

    // Überprüfen, ob bereits ein aktiver Vertrag existiert
    const existingContract = await prisma.contract.findFirst({
      where: {
        restaurantId: restaurantId,
        status: 'ACTIVE'
      }
    });

    if (existingContract) {
      return res.status(400).json({ message: 'Es existiert bereits ein aktiver Vertrag für dieses Restaurant' });
    }

    // In einer echten Anwendung würde hier die Vertragserstellung und -unterzeichnung erfolgen
    // Hier simulieren wir einen erfolgreichen Vertragsabschluss

    // Vertragsdaten speichern (wird in der Regel nach der Zahlung aktualisiert)
    const contractData = {
      restaurantId: restaurantId,
      planId: planId,
      status: 'PENDING', // Wird nach erfolgreicher Zahlung auf ACTIVE gesetzt
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 Monat Laufzeit
      autoRenew: true,
      termsAccepted: true,
      termsAcceptedAt: new Date()
    };

    // Vertragsdaten in der Datenbank speichern
    const contract = await prisma.contract.create({
      data: contractData
    });

    return res.status(200).json({ 
      message: 'Vertrag erfolgreich erstellt',
      contract: contract.id
    });
  } catch (error) {
    console.error('Fehler bei der Vertragserstellung:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
