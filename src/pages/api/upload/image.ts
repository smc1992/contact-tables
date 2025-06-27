import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import { v2 as cloudinary } from 'cloudinary';
import { IncomingForm } from 'formidable';
import fs from 'fs';

// Cloudinary konfigurieren
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// FormData-Parsing deaktivieren, da wir formidable verwenden
export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Nur POST-Anfragen zulassen
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Authentifizierung prüfen
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

    // Prüfen, ob der Benutzer ein Restaurant oder Admin ist
    if (session.user.role !== 'RESTAURANT' && session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    // Form-Daten parsen
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024 // 10MB Limit
    });

    return new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Fehler beim Parsen des Formulars:', err);
          res.status(500).json({ message: 'Fehler beim Hochladen der Datei' });
          return resolve(true);
        }

        const file = files.file?.[0];
        if (!file) {
          res.status(400).json({ message: 'Keine Datei hochgeladen' });
          return resolve(true);
        }

        // Prüfen, ob es sich um ein Bild handelt
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype || '')) {
          res.status(400).json({ message: 'Nur Bilder (JPEG, PNG, WEBP, GIF) sind erlaubt' });
          return resolve(true);
        }

        try {
          // Bild zu Cloudinary hochladen
          const folder = user.role === 'RESTAURANT' && user.restaurant 
            ? `restaurants/${user.restaurant.id}` 
            : 'admin';

          const uploadResult = await cloudinary.uploader.upload(file.filepath, {
            folder,
            resource_type: 'image',
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
          });

          // Temporäre Datei löschen
          fs.unlinkSync(file.filepath);

          // URL des hochgeladenen Bildes zurückgeben
          res.status(200).json({
            message: 'Bild erfolgreich hochgeladen',
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id
          });
          return resolve(true);
        } catch (uploadError) {
          console.error('Fehler beim Hochladen zu Cloudinary:', uploadError);
          res.status(500).json({ message: 'Fehler beim Hochladen des Bildes' });
          return resolve(true);
        }
      });
    });
  } catch (error) {
    console.error('Fehler beim Bildupload:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
