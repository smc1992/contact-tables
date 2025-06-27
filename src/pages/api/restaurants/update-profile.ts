import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Nur POST-Anfragen zulassen
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
    
    // Benutzer aus der Datenbank abrufen, um Rolle und Restaurant-ID zu erhalten
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        role: true,
        restaurant: {
          select: { id: true }
        }
      }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Benutzer nicht gefunden' });
    }
    
    // Prüfen, ob der Benutzer ein Restaurant ist
    if (user.role !== 'RESTAURANT' || !user.restaurant) {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }
    
    // Restaurant-ID aus dem Benutzer holen
    const restaurantId = user.restaurant.id;
    if (!restaurantId) {
      return res.status(400).json({ message: 'Kein Restaurant zugeordnet' });
    }

    // Daten aus dem Request-Body extrahieren
    const {
      name,
      description,
      address,
      city,
      postalCode,
      country,
      phone,
      email,
      website,
      openingHours,
      cuisine,
      priceRange,
      features,
      images,
      coverImage,
      logoImage,
      menuUrl
    } = req.body;

    // Validierung der Pflichtfelder
    if (!name || !description || !address || !city || !postalCode || !country || !phone || !email) {
      return res.status(400).json({ message: 'Bitte füllen Sie alle Pflichtfelder aus' });
    }

    // Restaurant-Profil aktualisieren
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name,
        description,
        address,
        city,
        postalCode,
        country,
        phone,
        email,
        website,
        openingHours: openingHours ? JSON.stringify(openingHours) : undefined,
        cuisine,
        priceRange,
        // Speichere features als JSON-String in einem benutzerdefinierten Feld
        // @ts-ignore - Das features-Feld ist in Prisma definiert, aber TypeScript erkennt es nicht korrekt
        features: features ? JSON.stringify(features) : undefined,
        coverImage,
        logoImage,
        menuUrl,
        updatedAt: new Date()
      }
    });

    // Wenn Bilder vorhanden sind, diese aktualisieren
    if (images && Array.isArray(images)) {
      // Bestehende Bilder löschen
      await prisma.restaurantImage.deleteMany({
        where: { restaurantId }
      });

      // Neue Bilder hinzufügen
      await prisma.restaurantImage.createMany({
        data: images.map((image: string, index: number) => ({
          restaurantId,
          url: image,
          sortOrder: index
        }))
      });
    }

    return res.status(200).json({
      message: 'Restaurant-Profil erfolgreich aktualisiert',
      restaurant: updatedRestaurant
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Restaurant-Profils:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
