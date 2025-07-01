import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { Pool } from 'pg';

// It's recommended to use a connection pool.
// It's recommended to use a connection pool.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Supabase client setup for API routes
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => req.cookies[name],
          set: () => {},
          remove: () => {},
        },
        cookieOptions: {
          name: 'contact-tables-auth',
        },
      }
    );

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    // --- HANDLE IMAGE DELETION ---
    if (req.method === 'DELETE') {
      const { imageId, restaurantId } = req.body;

      if (!imageId || !restaurantId) {
        return res.status(400).json({ message: 'Bild-ID und Restaurant-ID sind erforderlich.' });
      }

      // 1. Verify ownership
      const { data: restaurant, error: ownerError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', restaurantId)
        .eq('userId', user.id)
        .single();

      if (ownerError || !restaurant) {
        return res.status(403).json({ message: 'Keine Berechtigung, dieses Bild zu löschen.' });
      }

      // 2. Get image URL
      const { data: image, error: imageError } = await supabase
        .from('restaurant_images')
        .select('url')
        .eq('id', imageId)
        .single();

      if (imageError || !image) {
        return res.status(404).json({ message: 'Bild nicht gefunden.' });
      }

      // 3. Delete DB record
      const { error: dbDeleteError } = await supabase
        .from('restaurant_images')
        .delete()
        .eq('id', imageId);

      if (dbDeleteError) {
        throw new Error(`Datenbankfehler: ${dbDeleteError.message}`);
      }

      // 4. Delete from Storage
      const bucketName = 'restaurant-images';
      if (!image.url.startsWith('http')) {
          throw new Error('Ungültige Bild-URL im Datensatz.');
      }
      const filePath = new URL(image.url).pathname.split(`/${bucketName}/`)[1];
      if (!filePath) {
          throw new Error('Konnte den Dateipfad aus der URL nicht extrahieren.');
      }
      const { error: storageError } = await supabase.storage.from(bucketName).remove([filePath]);
      if (storageError) {
        console.error('Fehler beim Löschen der Datei aus dem Storage:', storageError.message);
      }

      return res.status(200).json({ message: 'Bild erfolgreich gelöscht.' });
    }

    // --- HANDLE SETTING PRIMARY IMAGE ---
    if (req.method === 'PUT') {
      const { imageId, restaurantId, imageUrl } = req.body;

      if (!imageId || !restaurantId || !imageUrl) {
        return res.status(400).json({ message: 'Bild-ID, Restaurant-ID und Bild-URL sind erforderlich.' });
      }

      let client;
      try {
        client = await pool.connect();
        await client.query('BEGIN');

        // 1. Verify ownership
        const { data: restaurant, error: ownerError } = await supabase
          .from('restaurants')
          .select('id')
          .eq('id', restaurantId)
          .eq('userId', user.id)
          .single();

        if (ownerError || !restaurant) {
          throw new Error('Keine Berechtigung, dieses Bild zu ändern.');
        }

        // 2. Set all other images to not primary
        await client.query('UPDATE restaurant_images SET is_primary = false WHERE restaurant_id = $1', [restaurantId]);

        // 3. Set the selected image to primary
        await client.query('UPDATE restaurant_images SET is_primary = true WHERE id = $1', [imageId]);

        // 4. Update the main image_url in the restaurants table
        await client.query('UPDATE restaurants SET image_url = $1 WHERE id = $2', [imageUrl, restaurantId]);

        await client.query('COMMIT');
        return res.status(200).json({ message: 'Hauptbild erfolgreich festgelegt.' });

      } catch (error: any) {
        if (client) {
          await client.query('ROLLBACK');
        }
        throw error; // Re-throw to be caught by the global handler
      } finally {
        if (client) {
          client.release();
        }
      }
    }

    // Handle other methods
    res.setHeader('Allow', ['DELETE', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);

  } catch (error: any) {
    console.error('Ein unerwarteter Fehler ist in der API-Route aufgetreten:', error);
    return res.status(500).json({ message: error.message || 'Ein schwerwiegender interner Serverfehler ist aufgetreten.' });
  }
}
