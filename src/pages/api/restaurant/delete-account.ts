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
        images: {
          select: {
            id: true,
            publicId: true
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

    // Transaktion starten, um alle Änderungen atomar durchzuführen
    await prisma.$transaction(async (tx) => {
      // 1. Alle Contact Tables löschen (in einer echten Implementierung)
      // await tx.contactTable.deleteMany({
      //   where: { restaurantId }
      // });
      
      // 2. Alle Bilder aus Cloudinary löschen
      for (const image of restaurant.images) {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (cloudinaryError) {
            console.error('Fehler beim Löschen des Bildes aus Cloudinary:', cloudinaryError);
            // Wir setzen den Prozess fort, auch wenn das Löschen aus Cloudinary fehlschlägt
          }
        }
      }
      
      // 3. Alle Bilder aus der Datenbank löschen
      await tx.restaurantImage.deleteMany({
        where: { restaurantId }
      });
      
      // 4. Vertrag löschen
      await tx.contract.deleteMany({
        where: { restaurantId }
      });
      
      // 5. Rechnungen löschen
      await tx.invoice.deleteMany({
        where: { restaurantId }
      });
      
      // 6. Restaurant löschen
      await tx.restaurant.delete({
        where: { id: restaurantId }
      });
    });

    return res.status(200).json({ message: 'Restaurant-Konto erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Restaurant-Kontos:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
