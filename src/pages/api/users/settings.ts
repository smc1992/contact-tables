import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Supabase-Client erstellen
  const supabase = createClient({ req, res });

  // Benutzer-Session überprüfen
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({
      error: 'Nicht autorisiert',
      message: 'Sie müssen angemeldet sein, um auf diese Ressource zuzugreifen.'
    });
  }

  // Benutzer-ID aus der Session abrufen
  const userId = user.id;

  // GET-Anfrage für Benutzereinstellungen
  if (req.method === 'GET') {
    try {
      // Benutzereinstellungen aus der Datenbank abrufen
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Wenn keine Einstellungen gefunden wurden, Standard-Einstellungen zurückgeben
        if (error.code === 'PGRST116') {
          // Standard-Einstellungen
          const defaultSettings = {
            notifications: {
              email: true,
              push: true,
              eventReminders: true,
              messages: true,
              marketing: false
            },
            privacy: {
              profileVisibility: 'public',
              showContactInfo: false,
              allowLocationAccess: true
            },
            language: 'de',
            theme: 'light'
          };

          return res.status(200).json({
            settings: defaultSettings,
            message: 'Standard-Einstellungen zurückgegeben, da keine benutzerdefinierten Einstellungen gefunden wurden.'
          });
        }

        console.error('Fehler beim Abrufen der Benutzereinstellungen:', error);
        return res.status(500).json({
          error: 'Datenbankfehler',
          message: 'Fehler beim Abrufen der Benutzereinstellungen.'
        });
      }

      return res.status(200).json({
        settings: data,
        message: 'Benutzereinstellungen erfolgreich abgerufen.'
      });
    } catch (err) {
      console.error('Unerwarteter Fehler beim Abrufen der Benutzereinstellungen:', err);
      return res.status(500).json({
        error: 'Serverfehler',
        message: 'Ein unerwarteter Fehler ist aufgetreten.'
      });
    }
  }

  // PUT-Anfrage für Aktualisierung der Benutzereinstellungen
  if (req.method === 'PUT') {
    try {
      const settings = req.body;
      
      // Debug-Ausgabe der Anfrage
      console.log('Einstellungen-Update-Anfrage erhalten:', {
        userId,
        settings,
        userMetadata: user.user_metadata
      });

      // Transaktion für konsistente Aktualisierung beider Tabellen
      const [settingsResult, profileResult] = await Promise.all([
        // Einstellungen aktualisieren
        supabase
          .from('user_settings')
          .upsert({
            user_id: userId,
            ...settings,
            updated_at: new Date().toISOString()
          })
          .select(),
        
        // Profil aktualisieren (relevante Felder)
        supabase
          .from('profiles')
          .upsert({
            id: userId,
            name: user.user_metadata?.name || 'Benutzer',
            language_code: settings.language || 'de',
            updated_at: new Date().toISOString()
          })
          .select()
      ]);
      
      // Debug-Ausgabe des Ergebnisses
      console.log('Einstellungen-Update-Ergebnis:', {
        settingsSuccess: !settingsResult.error,
        settingsData: settingsResult.data,
        settingsError: settingsResult.error,
        profileSuccess: !profileResult.error,
        profileData: profileResult.data,
        profileError: profileResult.error
      });

      if (settingsResult.error || profileResult.error) {
        console.error('Fehler beim Aktualisieren:', {
          settingsError: settingsResult.error,
          profileError: profileResult.error
        });
        return res.status(500).json({
          error: 'Datenbankfehler',
          message: 'Fehler beim Aktualisieren der Benutzereinstellungen oder des Profils.'
        });
      }

      return res.status(200).json({
        settings: settingsResult.data?.[0],
        profile: profileResult.data?.[0],
        message: 'Benutzereinstellungen und Profil erfolgreich aktualisiert.'
      });
    } catch (err) {
      console.error('Unerwarteter Fehler beim Aktualisieren der Benutzereinstellungen:', err);
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
