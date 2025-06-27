import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { sendNewContactTableRequestToRestaurant, sendContactTableConfirmationToCustomer } from '../../../utils/email';

const prisma = new PrismaClient();

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

    // Prüfen, ob der Benutzer ein zahlender Kunde ist
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isPaying: true, name: true, email: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    if (!user.isPaying) {
      return res.status(403).json({ 
        message: 'Für diese Funktion ist ein Premium-Konto erforderlich',
        requiresPayment: true
      });
    }

    // Daten aus dem Request-Body extrahieren
    const {
      restaurantId,
      date,
      time,
      partySize,
      message,
      isPublic = true
    } = req.body;

    // Validierung der Pflichtfelder
    if (!restaurantId || !date || !time || !partySize) {
      return res.status(400).json({ message: 'Bitte füllen Sie alle Pflichtfelder aus' });
    }

    // Restaurant abrufen
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, name: true, email: true }
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    // Datum validieren (muss in der Zukunft liegen)
    const reservationDate = new Date(`${date}T${time}`);
    if (reservationDate < new Date()) {
      return res.status(400).json({ message: 'Das Datum muss in der Zukunft liegen' });
    }

    // Kontakttisch erstellen
    // @ts-ignore - Das contactTable-Modell ist in Prisma definiert, aber TypeScript erkennt es nicht korrekt
    const contactTable = await prisma.contactTable.create({
      data: {
        restaurantId,
        hostId: user.id,
        date: reservationDate,
        partySize,
        message: message || '',
        status: 'OPEN',
        isPublic,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // E-Mail an Restaurant senden
    await sendNewContactTableRequestToRestaurant({
      restaurantEmail: restaurant.email ?? '',
      restaurantName: restaurant.name,
      customerName: user.name || 'Kunde',
      date,
      time,
      partySize,
      message
    });

    // Bestätigungs-E-Mail an Kunden senden
    await sendContactTableConfirmationToCustomer({
      customerEmail: user.email || '',
      customerName: user.name || 'Kunde',
      restaurantName: restaurant.name,
      date,
      time,
      partySize
    });

    return res.status(201).json({
      message: 'Kontakttisch erfolgreich erstellt',
      contactTable
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Kontakttisches:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
