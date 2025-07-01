import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../utils/supabase/server';
import prisma from '../../../lib/prisma';
import { EventStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Supabase-Client mit dem Request-Kontext erstellen
  const supabase = createClient({ req, res });

  // Benutzer aus der Session holen
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  // Überprüfen, ob der Benutzer die Rolle 'RESTAURANT' hat
  const userRole = user.user_metadata?.role;
  if (userRole !== 'RESTAURANT') {
    return res.status(403).json({ message: 'Zugriff verweigert: Nur für Restaurants' });
  }

  try {
    // Das zugehörige Restaurant des Benutzers finden
    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Kein zugehöriges Restaurant für diesen Benutzer gefunden.' });
    }

    const { title, description, datetime, maxParticipants, price, isPublic } = req.body;

    // Validierung der Eingabedaten
    if (!title || !datetime || !maxParticipants) {
      return res.status(400).json({ message: 'Bitte füllen Sie alle erforderlichen Felder aus.' });
    }

    const eventDate = new Date(datetime);
    if (isNaN(eventDate.getTime())) {
        return res.status(400).json({ message: 'Ungültiges Datumsformat.' });
    }

    // Neuen Contact Table (Event) in der Datenbank erstellen
    const newEvent = await prisma.event.create({
      data: {
        title,
        description: description || null,
        datetime: eventDate,
        maxParticipants: Number(maxParticipants),
        price: Number(price) || 0,
        isPublic: isPublic === true,
        status: EventStatus.OPEN, // Standardstatus
        restaurantId: restaurant.id, // Verknüpfung mit dem Restaurant
      },
    });

    return res.status(201).json(newEvent);

  } catch (error) {
    console.error('Fehler beim Erstellen des Contact Tables:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.';
    return res.status(500).json({ message: 'Interner Serverfehler', error: errorMessage });
  }
}
