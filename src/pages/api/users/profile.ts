import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Supabase-Client erstellen, der für serverseitige Vorgänge (API-Routen) geeignet ist
  const supabase = createClient({ req, res });

  // Benutzer-Session überprüfen
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({
      error: 'Nicht autorisiert',
      message: 'Sie müssen angemeldet sein, um auf diese Ressource zuzugreifen.'
    });
  }

  const userId = user.id;

  // GET: Benutzerprofil abrufen
  if (req.method === 'GET') {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // PGRST116: no rows found, was in diesem Fall kein Fehler ist.
      if (error && error.code !== 'PGRST116') {
        console.error('Fehler beim Abrufen des Benutzerprofils:', error);
        return res.status(500).json({
          error: 'Datenbankfehler',
          message: 'Fehler beim Abrufen des Benutzerprofils.'
        });
      }

      if (!profile) {
        // Fallback: Erstellt ein temporäres Profil aus Auth-Daten, wenn kein DB-Eintrag existiert.
        const defaultProfile = {
          id: userId,
          email: user.email,
          name: user.user_metadata?.name || 'Benutzer',
          languageCode: 'de',
          role: user.user_metadata?.role || 'USER',
          isPaying: false,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        };
        return res.status(200).json({
          data: defaultProfile,
          message: 'Standardprofil zurückgegeben, da kein Datenbankeintrag gefunden wurde.'
        });
      }

      return res.status(200).json({
        data: profile,
        message: 'Benutzerprofil erfolgreich abgerufen.'
      });
    } catch (err) {
      console.error('Unerwarteter Fehler beim Abrufen des Benutzerprofils:', err);
      return res.status(500).json({
        error: 'Serverfehler',
        message: 'Ein unerwarteter Fehler ist aufgetreten.'
      });
    }
  }

  // PUT: Benutzerprofil aktualisieren
  if (req.method === 'PUT') {
    try {
      const { name, languageCode } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Ungültige Anfrage', message: 'Name ist erforderlich.' });
      }

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name,
          languageCode: languageCode || 'de',
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Fehler beim Aktualisieren des Profils:', error);
        return res.status(500).json({ error: 'Datenbankfehler', message: 'Fehler beim Aktualisieren des Profils.' });
      }

      return res.status(200).json({ data: updatedProfile, message: 'Profil erfolgreich aktualisiert.' });
    } catch (err) {
      console.error('Unerwarteter Fehler beim Aktualisieren des Profils:', err);
      return res.status(500).json({ error: 'Serverfehler', message: 'Ein unerwarteter Fehler ist aufgetreten.' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
