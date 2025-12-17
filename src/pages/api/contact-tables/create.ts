import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../utils/supabase/server';
import prisma from '../../../lib/prisma';
import { sendEmail } from '../../../utils/emailService';
import { NotificationSettings } from '../../../types/settings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const supabase = createClient({ req, res });
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const userRole = user.user_metadata?.role;
  if (userRole !== 'RESTAURANT') {
    return res.status(403).json({ message: 'Zugriff verweigert: Nur für Restaurants' });
  }

  try {
    // Restaurant-Daten inklusive Benachrichtigungseinstellungen abrufen
    const restaurant = await prisma.restaurant.findFirst({
      where: { userId: user.id },
      select: { 
        id: true, 
        notificationSettings: true 
      },
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Kein zugehöriges Restaurant für diesen Benutzer gefunden.' });
    }

    const { title, description, datetime, maxParticipants, price, isPublic } = req.body;

    if (!title || !datetime || !maxParticipants) {
      return res.status(400).json({ message: 'Bitte füllen Sie alle erforderlichen Felder aus.' });
    }

    const eventDate = new Date(datetime);
    if (isNaN(eventDate.getTime())) {
        return res.status(400).json({ message: 'Ungültiges Datumsformat.' });
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        description: description || null,
        datetime: eventDate,
        maxParticipants: Number(maxParticipants),
        price: Number(price) || 0,
        isPublic: isPublic === true,
        status: 'OPEN',
        restaurantId: restaurant.id,
      },
    });

    // Benachrichtigung senden, wenn aktiviert
    if (restaurant.notificationSettings) {
      const settings = restaurant.notificationSettings as unknown as NotificationSettings;
      if (settings.contactTableUpdates && user.email) {
        sendEmail({
          to: user.email,
          subject: `Neuer contact-table erstellt: ${newEvent.title}`,
          html: `
            <h1>Bestätigung: Neuer contact-table</h1>
            <p>Hallo,</p>
            <p>Sie haben erfolgreich einen neuen contact-table mit dem Titel "<strong>${newEvent.title}</strong>" erstellt.</p>
            <p>Datum: ${new Date(newEvent.datetime).toLocaleString('de-DE')}</p>
            <p>Maximale Teilnehmer: ${newEvent.maxParticipants}</p>
            <p>Vielen Dank, dass Sie contact-tables nutzen!</p>
          `,
        }).catch(console.error); // E-Mail-Versand im Hintergrund, Fehler nur loggen
      }
    }

    return res.status(201).json(newEvent);

  } catch (error) {
    console.error('Fehler beim Erstellen des Events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.';
    return res.status(500).json({ message: 'Interner Serverfehler', error: errorMessage });
  }
}
