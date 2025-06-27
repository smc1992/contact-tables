import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import * as formidable from 'formidable'; // Changed to namespace import
import fs from 'fs'; // formidable might need fs for temp files
import { v4 as uuidv4 } from 'uuid'; // @ts-ignore - Fehlende Typdefinitionen, falls immer noch relevant

// Typdefinitionen für formidable
type FormidableFile = formidable.File;

// Deaktiviere den Body-Parser für diese Route, da wir FormData verarbeiten
export const config = {
  api: {
    bodyParser: false,
  },
};

const STORAGE_BUCKET_NAME = 'restaurant-images'; // Definiere deinen Bucket-Namen

// Hilfsfunktion zum Parsen von FormData
const parseForm = async (req: NextApiRequest) => {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    const form = new formidable.IncomingForm({
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      multiples: true, // Erlaube mehrere Dateien unter demselben Feldnamen
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies[name],
        set: (name: string, value: string, options: CookieOptions) => {
          // res.setHeader('Set-Cookie', ...) wird hier nicht direkt funktionieren, da Cookies über context gesetzt werden
          // In API Routes ist es besser, wenn der Client die Session aktuell hält.
          // Für serverseitige Operationen ist der getUser() Aufruf entscheidend.
        },
        remove: (name: string, options: CookieOptions) => {
          // Ähnlich wie set
        },
      },
      cookieOptions: {
        name: process.env.NEXT_PUBLIC_SUPABASE_COOKIE_NAME || 'contact-tables-auth',
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const userRole = user.user_metadata?.data?.role as string || user.user_metadata?.role as string || 'CUSTOMER';
  if (userRole !== 'RESTAURANT') {
    return res.status(403).json({ message: 'Keine Berechtigung, Bilder hochzuladen' });
  }

  let formFilesScope: formidable.Files | undefined; // Declare here for wider scope
  try {
    const { fields, files: parsedFormFiles } = await parseForm(req); // Rename destructured 'files'
    formFilesScope = parsedFormFiles; // Assign to outer scope variable

    const restaurantIdFromForm = fields.restaurantId;
    let restaurantId: string | undefined;

    if (Array.isArray(restaurantIdFromForm)) {
        restaurantId = restaurantIdFromForm[0];
    } else if (typeof restaurantIdFromForm === 'string') {
        restaurantId = restaurantIdFromForm;
    }
    
    if (!restaurantId) { // This now correctly checks if restaurantId is undefined or an empty string after processing
      return res.status(400).json({ message: 'Restaurant-ID ist erforderlich oder ungültig' });
    }

    // Überprüfe, ob der authentifizierte Benutzer der Besitzer des Restaurants ist
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, userId')
      .eq('id', restaurantId)
      .eq('userId', user.id)
      .single();

    if (restaurantError || !restaurantData) {
      console.error('Fehler beim Abrufen des Restaurants oder Benutzer nicht Besitzer:', restaurantError);
      return res.status(403).json({ message: 'Keine Berechtigung für dieses Restaurant oder Restaurant nicht gefunden' });
    }

    const imageFiles = parsedFormFiles.images ? (Array.isArray(parsedFormFiles.images) ? parsedFormFiles.images : [parsedFormFiles.images]) : [];

    if (imageFiles.length === 0) {
      return res.status(400).json({ message: 'Keine Bilder zum Hochladen gefunden' });
    }

    const uploadedImageResponses = [];

    for (const file of imageFiles) {
      if (!file || !file.filepath || !file.originalFilename || !file.mimetype) continue;

      const fileBuffer = fs.readFileSync(file.filepath);
      const uniqueFilename = `${uuidv4()}-${file.originalFilename}`;
      const storagePath = `${restaurantId}/${uniqueFilename}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: file.mimetype,
          upsert: false, // Nicht überschreiben, falls Datei existiert (sollte durch UUID unwahrscheinlich sein)
        });

      if (uploadError) {
        console.error('Supabase Storage Upload Fehler:', uploadError);
        // Fahre mit dem nächsten Bild fort oder breche ab, je nach Anforderung
        // Hier wird ein Fehler für die gesamte Anfrage zurückgegeben, wenn ein Upload fehlschlägt
        return res.status(500).json({ message: `Fehler beim Hochladen von ${file.originalFilename}: ${uploadError.message}` });
      }

      // Temporäre Aufräumarbeiten für formidable
      fs.unlinkSync(file.filepath);

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .getPublicUrl(uploadData.path);

      // Prüfe, ob bereits ein Hauptbild existiert
      const { data: existingPrimaryImage, error: primaryCheckError } = await supabase
        .from('RestaurantImage')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('is_primary', true)
        .limit(1);

      if (primaryCheckError) {
        console.error('Fehler beim Prüfen des Hauptbildes:', primaryCheckError);
        // Fehlerbehandlung, evtl. trotzdem fortfahren und kein Hauptbild setzen
      }

      const isPrimary = !existingPrimaryImage || existingPrimaryImage.length === 0;

      const { data: dbImageData, error: dbInsertError } = await supabase
        .from('RestaurantImage')
        .insert({
          restaurant_id: restaurantId,
          url: publicUrlData.publicUrl,
          is_primary: isPrimary,
          // Optional: name: file.originalFilename, size: file.size, type: file.mimetype
        })
        .select()
        .single(); // .single() um das eingefügte Objekt zurückzubekommen

      if (dbInsertError) {
        console.error('Supabase DB Insert Fehler für RestaurantImage:', dbInsertError);
        // Hier könnte man versuchen, das bereits hochgeladene Bild aus dem Storage zu löschen
        return res.status(500).json({ message: `Fehler beim Speichern der Bildmetadaten: ${dbInsertError.message}` });
      }
      
      uploadedImageResponses.push(dbImageData);

      // Wenn es das erste Bild ist UND erfolgreich in DB gespeichert wurde, aktualisiere restaurants.image_url
      if (isPrimary && dbImageData) {
        const { error: updateRestaurantError } = await supabase
          .from('restaurants')
          .update({ image_url: publicUrlData.publicUrl })
          .eq('id', restaurantId);

        if (updateRestaurantError) {
          console.error('Fehler beim Aktualisieren von restaurants.image_url:', updateRestaurantError);
          // Nicht-kritischer Fehler, Upload war trotzdem erfolgreich
        }
      }
    }

    return res.status(200).json({
      message: 'Bilder erfolgreich hochgeladen',
      images: uploadedImageResponses, // Gibt die in der DB gespeicherten Bildobjekte zurück
    });

  } catch (error: any) {
    console.error('Fehler beim Hochladen der Bilder:', error);
    // Sicherstellen, dass temporäre Dateien gelöscht werden, falls formidable sie nicht selbst löscht
    if (formFilesScope && formFilesScope.images) { // Use the variable from the outer scope
      const imageFilesToClean = Array.isArray(formFilesScope.images) ? formFilesScope.images : [formFilesScope.images];
      imageFilesToClean.forEach((file: FormidableFile) => { // Add type to 'file'
        if (file && file.filepath && fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
        }
      });
    }
    return res.status(500).json({ message: error.message || 'Interner Serverfehler' });
  }
}
