import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  try {
    // Daten aus dem Request-Body extrahieren
    const {
      restaurantName,
      address,
      city,
      postalCode,
      country,
      phone,
      email,
      website,
      description,
      cuisine,
      capacity,
      openingHours,
      contactName,
      contactEmail,
      contactPhone,
      termsAccepted,
      dataPrivacyAccepted
    } = req.body;

    // Validierung der Pflichtfelder
    if (!restaurantName || !address || !city || !postalCode || !phone || !email || !contactName || !contactEmail) {
      return res.status(400).json({ message: 'Bitte füllen Sie alle Pflichtfelder aus' });
    }

    // Supabase-Client erstellen, um zu prüfen, ob der Benutzer eingeloggt ist
    const supabase = createPagesServerClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    let userId = null;

    // Wenn ein Benutzer eingeloggt ist, verwenden wir seine ID
    if (session) {
      userId = session.user.id;
    } else {
      // Wenn kein Benutzer eingeloggt ist, erstellen wir einen neuen Benutzer
      // In einer echten Anwendung würde hier eine E-Mail-Bestätigung erfolgen
      const { data: newUser, error } = await supabase.auth.signUp({
        email: contactEmail,
        password: Math.random().toString(36).slice(-8), // Zufälliges Passwort generieren
        options: {
          data: {
            name: contactName,
            role: 'RESTAURANT'
          }
        }
      });

      if (error) {
        console.error('Fehler bei der Benutzerregistrierung:', error);
        return res.status(500).json({ message: 'Fehler bei der Benutzerregistrierung' });
      }

      userId = newUser.user?.id;
    }

    // Prüfen, ob bereits ein Restaurant mit dieser E-Mail existiert
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        email: email
      }
    });

    if (existingRestaurant) {
      return res.status(400).json({ message: 'Ein Restaurant mit dieser E-Mail-Adresse existiert bereits' });
    }

    // Benutzer in der Datenbank erstellen oder aktualisieren
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        name: contactName,
        email: contactEmail,
        role: 'RESTAURANT'
      },
      create: {
        id: userId,
        name: contactName,
        email: contactEmail,
        role: 'RESTAURANT'
      }
    });

    // Restaurant in der Datenbank erstellen
    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantName,
        address,
        city,
        postalCode,
        country,
        phone,
        email,
        website: website || null,
        description: description || null,
        cuisine: cuisine || null,
        capacity: capacity ? parseInt(capacity) : null,
        openingHours: openingHours || null,
        contractStatus: 'PENDING',
        userId: userId,
        contactName,
        contactEmail,
        contactPhone: contactPhone || null
      }
    });

    // Erfolgreiche Antwort senden
    return res.status(201).json({
      message: 'Partneranfrage erfolgreich gesendet',
      restaurantId: restaurant.id
    });
  } catch (error) {
    console.error('Fehler bei der Verarbeitung der Partneranfrage:', error);
    return res.status(500).json({ message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' });
  } finally {
    await prisma.$disconnect();
  }
}
