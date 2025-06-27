import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Supabase-Client erstellen
  const supabase = createClient(req.cookies);

  // Benutzer-Session überprüfen
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({
      error: 'Nicht autorisiert',
      message: 'Sie müssen angemeldet sein, um auf diese Ressource zuzugreifen.'
    });
  }

  // Benutzer-ID aus der Session abrufen
  const userId = session.user.id;

  // GET: Benutzerprofil abrufen
  if (req.method === 'GET') {
    try {
      // Benutzerprofil aus Supabase abrufen
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Fehler beim Abrufen des Benutzerprofils:', error);
        return res.status(500).json({
          error: 'Datenbankfehler',
          message: 'Fehler beim Abrufen des Benutzerprofils.'
        });
      }

      if (!profile) {
        // Wenn kein Profil gefunden wurde, Standardprofil erstellen
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData || !userData.user) {
          return res.status(404).json({
            error: 'Nicht gefunden',
            message: 'Benutzer nicht gefunden.'
          });
        }
        
        // Standardprofil erstellen
        const defaultProfile = {
          id: userId,
          email: userData.user.email,
          name: userData.user.user_metadata?.name || 'Benutzer',
          languageCode: 'de',
          role: userData.user.user_metadata?.role || 'USER',
          isPaying: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        return res.status(200).json({
          data: defaultProfile,
          message: 'Standardprofil zurückgegeben.'
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

      // Validierung
      if (!name) {
        return res.status(400).json({
          error: 'Ungültige Anfrage',
          message: 'Name ist erforderlich.'
        });
      }

      // Profil aktualisieren
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name,
          languageCode: languageCode || 'de',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Fehler beim Aktualisieren des Benutzerprofils:', error);
        return res.status(500).json({
          error: 'Datenbankfehler',
          message: 'Fehler beim Aktualisieren des Benutzerprofils.'
        });
      }

      return res.status(200).json({
        data: updatedProfile,
        message: 'Benutzerprofil erfolgreich aktualisiert.'
      });
    } catch (err) {
      console.error('Unerwarteter Fehler beim Aktualisieren des Benutzerprofils:', err);
      return res.status(500).json({
        error: 'Serverfehler',
        message: 'Ein unerwarteter Fehler ist aufgetreten.'
      });
    }
  }

  // Methode nicht erlaubt
  return res.status(405).json({
    error: 'Methode nicht erlaubt',
    message: `Die Methode ${req.method} ist für diesen Endpunkt nicht erlaubt.`
  });
}
