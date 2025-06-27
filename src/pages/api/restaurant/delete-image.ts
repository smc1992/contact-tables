import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const STORAGE_BUCKET_NAME = 'restaurant-images';

// Hilfsfunktion zum Extrahieren des Pfades aus der Supabase Storage URL
const getPathFromSupabaseUrl = (url: string): string | null => {
  try {
    const urlObject = new URL(url);
    // Der Pfad ist typischerweise /storage/v1/object/public/<bucket-name>/<path-to-file>
    // Wir wollen <path-to-file>
    const pathSegments = urlObject.pathname.split('/');
    if (pathSegments.length > 5 && pathSegments[4] === STORAGE_BUCKET_NAME) {
      return pathSegments.slice(5).join('/');
    }
    return null;
  } catch (e) {
    console.error('Error parsing Supabase URL:', e);
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies[name],
        set: (name: string, value: string, options: CookieOptions) => {},
        remove: (name: string, options: CookieOptions) => {},
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
    return res.status(403).json({ message: 'Keine Berechtigung, Bilder zu löschen' });
  }

  const { imageId, restaurantId } = req.body;

  if (!imageId || !restaurantId) {
    return res.status(400).json({ message: 'Bild-ID und Restaurant-ID sind erforderlich' });
  }

  try {
    // Überprüfe, ob der authentifizierte Benutzer der Besitzer des Restaurants ist
    const { data: restaurantData, error: restaurantOwnerError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .eq('userId', user.id) // Wichtig: Spaltenname 'userId' in 'restaurants' muss korrekt sein
      .single();

    if (restaurantOwnerError || !restaurantData) {
      return res.status(403).json({ message: 'Keine Berechtigung für dieses Restaurant oder Restaurant nicht gefunden' });
    }

    // Bild in der Datenbank finden
    const { data: image, error: imageError } = await supabase
      .from('RestaurantImage')
      .select('id, url, is_primary, restaurant_id')
      .eq('id', imageId)
      .eq('restaurant_id', restaurantId) // Stelle sicher, dass das Bild zum angegebenen Restaurant gehört
      .single();

    if (imageError || !image) {
      return res.status(404).json({ message: 'Bild nicht gefunden oder gehört nicht zu diesem Restaurant' });
    }

    // Bild aus der Datenbank löschen
    const { error: deleteDbError } = await supabase
      .from('RestaurantImage')
      .delete()
      .eq('id', imageId);

    if (deleteDbError) {
      console.error('Supabase DB Delete Fehler für RestaurantImage:', deleteDbError);
      return res.status(500).json({ message: `Fehler beim Löschen der Bildmetadaten: ${deleteDbError.message}` });
    }

    // Bild aus Supabase Storage löschen
    const filePathInBucket = getPathFromSupabaseUrl(image.url);
    if (filePathInBucket) {
      const { error: storageDeleteError } = await supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .remove([filePathInBucket]);
      
      if (storageDeleteError) {
        console.error('Supabase Storage Delete Fehler:', storageDeleteError);
        // Fehler ist nicht-kritisch für die Antwort, da DB-Eintrag weg ist, aber loggen!
      }
    } else {
      console.warn(`Konnte Pfad für Storage-Löschung nicht aus URL extrahieren: ${image.url}`);
    }

    // Wenn es sich um das Hauptbild handelt, ein anderes Bild als Hauptbild festlegen
    if (image.is_primary) {
      const { data: otherImages, error: findOtherError } = await supabase
        .from('RestaurantImage')
        .select('id, url')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: true }) // Nimm das älteste als nächstes Hauptbild
        .limit(1);

      if (findOtherError) {
        console.error('Fehler beim Suchen eines Ersatz-Hauptbildes:', findOtherError);
      }

      if (otherImages && otherImages.length > 0) {
        const newPrimaryImage = otherImages[0];
        const { error: updateNewPrimaryError } = await supabase
          .from('RestaurantImage')
          .update({ is_primary: true })
          .eq('id', newPrimaryImage.id);
        
        if (updateNewPrimaryError) console.error('Fehler beim Setzen des neuen Hauptbildes in RestaurantImage:', updateNewPrimaryError);

        const { error: updateRestaurantError } = await supabase
          .from('restaurants')
          .update({ image_url: newPrimaryImage.url }) // Spaltenname 'image_url' in 'restaurants'
          .eq('id', restaurantId);
        if (updateRestaurantError) console.error('Fehler beim Aktualisieren von restaurants.image_url:', updateRestaurantError);

      } else {
        // Kein anderes Bild vorhanden, Restaurant-Hauptbild zurücksetzen
        const { error: updateRestaurantError } = await supabase
          .from('restaurants')
          .update({ image_url: null })
          .eq('id', restaurantId);
        if (updateRestaurantError) console.error('Fehler beim Zurücksetzen von restaurants.image_url:', updateRestaurantError);
      }
    }

    return res.status(200).json({ message: 'Bild erfolgreich gelöscht' });
  } catch (error: any) {
    console.error('Fehler beim Löschen des Bildes:', error);
    return res.status(500).json({ message: error.message || 'Interner Serverfehler' });
  }
}
