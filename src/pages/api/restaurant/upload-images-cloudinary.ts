import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';
import { createReadStream } from 'fs';

// Konfiguration von Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Deaktivieren der standardmäßigen Body-Parser für diese Route,
// da wir Formidable für multipart/form-data verwenden
export const config = {
  api: {
    bodyParser: false,
  },
};

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

  try {
    // Formular mit Formidable parsen
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB Limit
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const restaurantId = fields.restaurantId as string;

    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
    }

    // Restaurant in der Datenbank finden
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        userId: true,
        images: {
          select: {
            id: true,
            isPrimary: true
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

    // Überprüfen, ob Dateien vorhanden sind
    const fileArray = files.images as formidable.File[];
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ message: 'Keine Bilder hochgeladen' });
    }

    // Bilder nach Cloudinary hochladen und in der Datenbank speichern
    const uploadedImages = [];
    const errors = [];

    for (const file of Array.isArray(fileArray) ? fileArray : [fileArray]) {
      try {
        // Bild zu Cloudinary hochladen
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `contact-tables/restaurants/${restaurantId}`,
              resource_type: 'image',
              transformation: [
                { width: 1200, height: 800, crop: 'limit' },
                { quality: 'auto:good' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          createReadStream(file.filepath).pipe(uploadStream);
        });

        // Prüfen, ob der Upload erfolgreich war
        if (!uploadResult) {
          errors.push(`Fehler beim Hochladen von ${file.originalFilename}`);
          continue;
        }

        // Bestimmen, ob dies das erste Bild und damit das Hauptbild ist
        const isPrimary = restaurant.images.length === 0;

        // Bild in der Datenbank speichern
        const image = await prisma.restaurantImage.create({
          data: {
            url: (uploadResult as any).secure_url,
            publicId: (uploadResult as any).public_id,
            restaurantId,
            isPrimary
          }
        });

        // Wenn es das Hauptbild ist, auch im Restaurant-Eintrag aktualisieren
        if (isPrimary) {
          await prisma.restaurant.update({
            where: { id: restaurantId },
            data: { imageUrl: (uploadResult as any).secure_url }
          });
        }

        uploadedImages.push(image);
      } catch (error) {
        console.error('Fehler beim Hochladen des Bildes:', error);
        errors.push(`Fehler beim Hochladen von ${file.originalFilename}`);
      }
    }

    // Antwort senden
    if (uploadedImages.length === 0) {
      return res.status(500).json({ 
        message: 'Alle Uploads fehlgeschlagen', 
        errors 
      });
    }

    return res.status(201).json({ 
      message: `${uploadedImages.length} Bild(er) erfolgreich hochgeladen`,
      images: uploadedImages,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Fehler beim Hochladen der Bilder:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
