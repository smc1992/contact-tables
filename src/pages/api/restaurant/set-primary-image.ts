import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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
    return res.status(403).json({ message: 'Keine Berechtigung, Hauptbild festzulegen' });
  }

  const { imageId, restaurantId } = req.body;

  if (!imageId || !restaurantId) {
    return res.status(400).json({ message: 'Bild-ID und Restaurant-ID sind erforderlich' });
  }

  try {
    // Überprüfe, ob der authentifizierte Benutzer der Besitzer des Restaurants ist
    const { data: restaurantData, error: restaurantOwnerError } = await supabase
      .from('restaurants')
      .select('id, userId') // userId wird hier benötigt, um den Besitzer zu verifizieren
      .eq('id', restaurantId)
      .single();

    if (restaurantOwnerError || !restaurantData) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    if (restaurantData.userId !== user.id) {
      return res.status(403).json({ message: 'Keine Berechtigung für dieses Restaurant' });
    }

    // Bild in der Datenbank finden, das zum Hauptbild werden soll
    const { data: imageToSetAsPrimary, error: imageError } = await supabase
      .from('restaurant_images')
      .select('id, url, is_primary, restaurant_id')
      .eq('id', imageId)
      .eq('restaurant_id', restaurantId) // Sicherstellen, dass das Bild zum Restaurant gehört
      .single();

    if (imageError || !imageToSetAsPrimary) {
      return res.status(404).json({ message: 'Bild nicht gefunden oder gehört nicht zu diesem Restaurant' });
    }

    // Wenn das Bild bereits das Hauptbild ist, nichts tun
    if (imageToSetAsPrimary.is_primary) {
      return res.status(200).json({ message: 'Dieses Bild ist bereits das Hauptbild' });
    }

    // Schritt 1: Alle Bilder dieses Restaurants auf is_primary = false setzen
    const { error: updateOldPrimaryError } = await supabase
      .from('restaurant_images')
      .update({ is_primary: false })
      .eq('restaurant_id', restaurantId);

    if (updateOldPrimaryError) {
      console.error('Fehler beim Zurücksetzen alter Hauptbilder:', updateOldPrimaryError);
      return res.status(500).json({ message: `Fehler beim Aktualisieren der Bilder: ${updateOldPrimaryError.message}` });
    }

    // Schritt 2: Das ausgewählte Bild als Hauptbild festlegen
    const { error: setNewPrimaryError } = await supabase
      .from('restaurant_images')
      .update({ is_primary: true })
      .eq('id', imageId);

    if (setNewPrimaryError) {
      console.error('Fehler beim Setzen des neuen Hauptbildes:', setNewPrimaryError);
      // Hier könnte man versuchen, den vorherigen Schritt rückgängig zu machen, ist aber komplex.
      return res.status(500).json({ message: `Fehler beim Setzen des Hauptbildes: ${setNewPrimaryError.message}` });
    }

    // Schritt 3: Restaurant-Hauptbild-URL aktualisieren
    const { error: updateRestaurantError } = await supabase
      .from('restaurants')
      .update({ image_url: imageToSetAsPrimary.url }) // Spaltenname 'image_url' in 'restaurants'
      .eq('id', restaurantId);

    if (updateRestaurantError) {
      console.error('Fehler beim Aktualisieren der Restaurant-Hauptbild-URL:', updateRestaurantError);
      return res.status(500).json({ message: `Fehler beim Aktualisieren des Restaurants: ${updateRestaurantError.message}` });
    }

    return res.status(200).json({ message: 'Hauptbild erfolgreich festgelegt' });
  } catch (error: any) {
    console.error('Fehler beim Festlegen des Hauptbildes:', error);
    return res.status(500).json({ message: error.message || 'Interner Serverfehler' });
  }
}
