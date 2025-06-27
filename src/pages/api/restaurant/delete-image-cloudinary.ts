import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

// Konfiguration von Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur DELETE-Anfragen erlauben
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  // Authentifizierung überprüfen
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const { imageId, restaurantId } = req.body;

  if (!imageId || !restaurantId) {
    return res.status(400).json({ message: 'Bild-ID und Restaurant-ID sind erforderlich' });
  }

  try {
    // Restaurant in der Datenbank finden
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        userId: true
      }
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    // Überprüfen, ob der Benutzer berechtigt ist
    if (restaurant.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    // Bild in der Datenbank finden
    const image = await prisma.restaurantImage.findUnique({
      where: { id: imageId },
      select: {
        url: true,
        publicId: true,
        isPrimary: true,
        restaurantId: true
      }
    });

    if (!image) {
      return res.status(404).json({ message: 'Bild nicht gefunden' });
    }

    if (image.restaurantId !== restaurantId) {
      return res.status(403).json({ message: 'Dieses Bild gehört nicht zu diesem Restaurant' });
    }

    // Bild aus Cloudinary löschen
    if (image.publicId) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
      } catch (cloudinaryError) {
        console.error('Fehler beim Löschen des Bildes aus Cloudinary:', cloudinaryError);
        // Wir setzen den Prozess fort, auch wenn das Löschen aus Cloudinary fehlschlägt
      }
    }

    // Transaktion starten, um alle Änderungen atomar durchzuführen
    await prisma.$transaction(async (tx) => {
      // Bild aus der Datenbank löschen
      await tx.restaurantImage.delete({
        where: { id: imageId }
      });

      // Wenn das gelöschte Bild das Hauptbild war, ein neues Hauptbild festlegen
      if (image.isPrimary) {
        // Nächstes verfügbares Bild finden
        const nextImage = await tx.restaurantImage.findFirst({
          where: { restaurantId },
          orderBy: { createdAt: 'desc' }
        });

        if (nextImage) {
          // Dieses Bild als Hauptbild festlegen
          await tx.restaurantImage.update({
            where: { id: nextImage.id },
            data: { isPrimary: true }
          });

          // Restaurant-Hauptbild aktualisieren
          await tx.restaurant.update({
            where: { id: restaurantId },
            data: { imageUrl: nextImage.url }
          });
        } else {
          // Kein Bild mehr vorhanden, Restaurant-Hauptbild zurücksetzen
          await tx.restaurant.update({
            where: { id: restaurantId },
            data: { imageUrl: null }
          });
        }
      }
    });

    return res.status(200).json({ message: 'Bild erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Bildes:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
