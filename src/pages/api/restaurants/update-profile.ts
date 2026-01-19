import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createClient } from '../../../utils/supabase/server';
import axios from 'axios';

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
    const supabase = createClient({ req, res });

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    const user = await prisma.profile.findUnique({
      where: { id: authUser.id },
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

    // Lade das aktuelle Restaurant, um die Adresse zu vergleichen
    const currentRestaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!currentRestaurant) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    // Prüfen, ob sich die Adresse geändert hat
    const addressHasChanged = 
      currentRestaurant.address !== address ||
      currentRestaurant.city !== city ||
      currentRestaurant.postal_code !== postalCode ||
      currentRestaurant.country !== country;

    let newCoords: { latitude: number | null; longitude: number | null } = {
      latitude: currentRestaurant.latitude,
      longitude: currentRestaurant.longitude,
    };

    if (addressHasChanged) {
      // Adresse hat sich geändert, führe Geocoding durch mit OpenCage (wie in register.ts)
      const fullAddress = `${address}, ${postalCode} ${city}, ${country}`;
      try {
        if (!process.env.OPENCAGE_API_KEY) {
           console.warn('OPENCAGE_API_KEY is missing. Skipping geocoding.');
        } else {
           const geocodingUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(fullAddress)}&key=${process.env.OPENCAGE_API_KEY}`;
           const response = await axios.get(geocodingUrl);
           const geoData = response.data;

           if (geoData.results && geoData.results.length > 0) {
             newCoords.latitude = geoData.results[0].geometry.lat;
             newCoords.longitude = geoData.results[0].geometry.lng;
           }
        }
      } catch (geoError) {
        console.error('Fehler beim Geocoding (OpenCage):', geoError);
        // Fahre fort, Koordinaten bleiben unverändert oder null, je nach Logik. 
        // Hier behalten wir die alten bei Fehler, oder setzen null wenn man will.
        // Aktuell: behalte die alten (Zeile 94-97 initialisiert mit currentRestaurant Werten)
        // Falls wir explizit resetten wollen bei Fehler:
        // newCoords.latitude = null;
        // newCoords.longitude = null;
      }
    }

    // Restaurant-Profil aktualisieren
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name,
        description,
        address,
        city,
        postal_code: postalCode,
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
        updatedAt: new Date(),
        latitude: newCoords.latitude,
        longitude: newCoords.longitude
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
        data: images.map((image: { url: string; publicId: string }, index: number) => ({
          restaurantId,
          url: image.url,
          publicId: image.publicId,
          isPrimary: index === 0,
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
