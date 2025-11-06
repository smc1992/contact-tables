import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient({ req, res });

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    if (req.method === 'DELETE') {
      const { imageId, restaurantId } = req.body;
      if (!imageId || !restaurantId) {
        return res.status(400).json({ message: 'Bild-ID und Restaurant-ID sind erforderlich.' });
      }

      const { data: restaurant, error: ownerError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', restaurantId)
        .eq('user_id', user.id)
        .single();

      if (ownerError || !restaurant) {
        return res.status(403).json({ message: 'Keine Berechtigung, dieses Bild zu löschen.' });
      }

      const { data: image, error: imageError } = await supabase
        .from('restaurant_images')
        .select('url')
        .eq('id', imageId)
        .single();

      if (imageError || !image) {
        return res.status(404).json({ message: 'Bild nicht gefunden.' });
      }

      const bucketName = 'restaurant-bilder';
      if (!image.url || !image.url.startsWith('http')) {
        return res.status(500).json({ message: 'Ungültige Bild-URL im Datensatz.' });
      }

      const filePath = new URL(image.url).pathname.split(`/${bucketName}/`)[1];
      if (!filePath) {
        return res.status(500).json({ message: 'Konnte den Dateipfad aus der URL nicht extrahieren.' });
      }

      const { error: storageError } = await supabase.storage.from(bucketName).remove([filePath]);
      if (storageError) {
        console.error('Fehler beim Löschen der Datei aus dem Storage:', storageError);
        return res.status(500).json({ message: `Fehler beim Löschen aus dem Storage: ${storageError.message}` });
      }

      const { error: dbDeleteError } = await supabase
        .from('restaurant_images')
        .delete()
        .eq('id', imageId);

      if (dbDeleteError) {
        console.error('Fehler beim Löschen des DB-Eintrags:', dbDeleteError);
        return res.status(500).json({ message: `Datenbankfehler: ${dbDeleteError.message}. Achtung: Datei wurde aus Storage gelöscht, aber DB-Eintrag nicht.` });
      }

      return res.status(200).json({ message: 'Bild erfolgreich gelöscht.' });
    }

    if (req.method === 'PUT') {
      const { imageId, restaurantId, imageUrl } = req.body;
      if (!imageId || !restaurantId || !imageUrl) {
        return res.status(400).json({ message: 'Bild-ID, Restaurant-ID und Bild-URL sind erforderlich.' });
      }

      const { data: restaurant, error: ownerError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', restaurantId)
        .eq('user_id', user.id)
        .single();

      if (ownerError || !restaurant) {
        return res.status(403).json({ message: 'Keine Berechtigung, dieses Bild zu ändern.' });
      }

      const { error: updateAllError } = await supabase
        .from('restaurant_images')
        .update({ is_primary: false })
        .eq('restaurant_id', restaurantId);

      if (updateAllError) {
        console.error('Fehler beim Zurücksetzen der Hauptbilder:', updateAllError);
        return res.status(500).json({ message: `DB-Fehler (1/3): ${updateAllError.message}` });
      }

      const { error: updateOneError } = await supabase
        .from('restaurant_images')
        .update({ is_primary: true })
        .eq('id', imageId);
      
      if (updateOneError) {
        console.error('Fehler beim Setzen des Hauptbildes:', updateOneError);
        return res.status(500).json({ message: `DB-Fehler (2/3): ${updateOneError.message}` });
      }

      const { error: updateRestError } = await supabase
        .from('restaurants')
        .update({ image_url: imageUrl })
        .eq('id', restaurantId);

      if (updateRestError) {
        console.error('Fehler beim Aktualisieren der Restaurant-URL:', updateRestError);
        return res.status(500).json({ message: `DB-Fehler (3/3): ${updateRestError.message}` });
      }

      return res.status(200).json({ message: 'Hauptbild erfolgreich festgelegt.' });
    }

    res.setHeader('Allow', ['DELETE', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);

  } catch (error: any) {
    console.error('Ein unerwarteter Fehler ist in der API-Route aufgetreten:', error);
    return res.status(500).json({ message: error.message || 'Ein schwerwiegender interner Serverfehler ist aufgetreten.' });
  }
}
