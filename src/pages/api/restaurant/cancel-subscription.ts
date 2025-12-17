import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  // Authentifizierung überprüfen
  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const { restaurantId } = req.body;

  if (!restaurantId) {
    return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
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
            startDate: true,
            status: true
          }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    // Überprüfen, ob der Benutzer berechtigt ist
    if (restaurant.userId !== user.id && user.user_metadata?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    // Überprüfen, ob das Restaurant aktiv ist
    if (!restaurant.isActive) {
      return res.status(403).json({ message: 'Restaurant ist nicht aktiv' });
    }

    // Überprüfen, ob der Vertrag existiert
    if (!restaurant.contract) {
      return res.status(404).json({ message: 'Kein aktiver Vertrag gefunden' });
    }

    // In einer echten Implementierung würden wir hier:
    // 1. Den Vertrag in der Datenbank als gekündigt markieren
    // 2. Eine Bestätigungs-E-Mail senden
    // 3. Die automatische Verlängerung deaktivieren
    // Für dieses Beispiel simulieren wir die Kündigung

    // Berechne ein Enddatum basierend auf dem Startdatum (z.B. 30 Tage nach Kündigung)
    const cancellationDate = new Date();
    
    // Simulierte Vertragskündigung
    const canceledContract = {
      id: restaurant.contract.id,
      status: 'CANCELLED', // Verwende den korrekten Enum-Wert aus dem Schema
      startDate: restaurant.contract.startDate,
      cancellationDate: cancellationDate.toISOString(),
      autoRenew: false
    };

    return res.status(200).json({ 
      message: 'Abonnement erfolgreich gekündigt. Es bleibt bis zum Ende der Laufzeit aktiv.',
      contract: canceledContract
    });
  } catch (error) {
    console.error('Fehler beim Kündigen des Abonnements:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
