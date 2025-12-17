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

  // GET: Benachrichtigungen abrufen
  if (req.method === 'GET') {
    try {
      const { limit = 10, page = 1, unreadOnly } = req.query;
      const limitNum = Number(limit);
      const pageNum = Number(page);
      const offset = (pageNum - 1) * limitNum;
      
      // Query aufbauen
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);
      
      // Filter für ungelesene Benachrichtigungen
      if (unreadOnly === 'true') {
        query = query.eq('read', false);
      }
      
      // Benachrichtigungen abrufen
      const { data: notifications, error, count } = await query;
      
      if (error) {
        console.error('Fehler beim Abrufen der Benachrichtigungen:', error);
        return res.status(500).json({
          error: 'Datenbankfehler',
          message: 'Fehler beim Abrufen der Benachrichtigungen.'
        });
      }
      
      // Wenn keine Benachrichtigungen gefunden wurden, Demo-Daten zurückgeben
      if (!notifications || notifications.length === 0) {
        // Demo-Benachrichtigungen
        const demoNotifications = [
          {
            id: 1,
            user_id: userId,
            type: 'event_invitation',
            title: 'Neue Event-Einladung',
            message: 'Sie wurden zu einem gemeinsamen Abendessen im Restaurant Bella Italia eingeladen.',
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            read: false,
            action_url: '/events/1'
          },
          {
            id: 2,
            user_id: userId,
            type: 'event_reminder',
            title: 'Event-Erinnerung',
            message: 'Ihr Event "Mittagessen mit neuen Kontakten" findet morgen um 12:30 Uhr statt.',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            read: true,
            action_url: '/events/2'
          },
          {
            id: 3,
            user_id: userId,
            type: 'new_message',
            title: 'Neue Nachricht',
            message: 'Sie haben eine neue Nachricht von Maria Schmidt erhalten.',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            read: false,
            action_url: '/messages/3'
          },
          {
            id: 4,
            user_id: userId,
            type: 'system',
            title: 'Willkommen bei Contact Tables',
            message: 'Vielen Dank für Ihre Registrierung! Entdecken Sie Restaurants und knüpfen Sie neue Kontakte.',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
            read: true,
            action_url: null
          }
        ];
        
        return res.status(200).json({
          data: {
            notifications: demoNotifications,
            pagination: {
              total: demoNotifications.length,
              page: pageNum,
              limit: limitNum,
              pages: 1
            }
          },
          message: 'Demo-Benachrichtigungen zurückgegeben.'
        });
      }
      
      return res.status(200).json({
        data: {
          notifications,
          pagination: {
            total: count || 0,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil((count || 0) / limitNum)
          }
        },
        message: 'Benachrichtigungen erfolgreich abgerufen.'
      });
    } catch (err) {
      console.error('Unerwarteter Fehler beim Abrufen der Benachrichtigungen:', err);
      return res.status(500).json({
        error: 'Serverfehler',
        message: 'Ein unerwarteter Fehler ist aufgetreten.'
      });
    }
  }

  // PATCH: Benachrichtigungen als gelesen markieren
  if (req.method === 'PATCH') {
    try {
      const { notificationId, markAllAsRead } = req.body;

      if (markAllAsRead) {
        // Alle Benachrichtigungen als gelesen markieren
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userId);

        if (error) {
          console.error('Fehler beim Markieren aller Benachrichtigungen als gelesen:', error);
          return res.status(500).json({
            error: 'Datenbankfehler',
            message: 'Fehler beim Markieren aller Benachrichtigungen als gelesen.'
          });
        }

        return res.status(200).json({
          message: 'Alle Benachrichtigungen wurden als gelesen markiert.'
        });
      } else if (notificationId) {
        // Einzelne Benachrichtigung als gelesen markieren
        const { data: notification, error: findError } = await supabase
          .from('notifications')
          .select('*')
          .eq('id', notificationId)
          .eq('user_id', userId)
          .single();

        if (findError || !notification) {
          return res.status(404).json({
            error: 'Nicht gefunden',
            message: 'Benachrichtigung nicht gefunden.'
          });
        }

        const { error: updateError } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Fehler beim Markieren der Benachrichtigung als gelesen:', updateError);
          return res.status(500).json({
            error: 'Datenbankfehler',
            message: 'Fehler beim Markieren der Benachrichtigung als gelesen.'
          });
        }

        return res.status(200).json({
          message: 'Benachrichtigung wurde als gelesen markiert.'
        });
      } else {
        return res.status(400).json({
          error: 'Ungültige Anfrage',
          message: 'Entweder notificationId oder markAllAsRead muss angegeben werden.'
        });
      }
    } catch (err) {
      console.error('Unerwarteter Fehler beim Markieren der Benachrichtigungen als gelesen:', err);
      return res.status(500).json({
        error: 'Serverfehler',
        message: 'Ein unerwarteter Fehler ist aufgetreten.'
      });
    }
  }

  // DELETE: Benachrichtigung löschen
  if (req.method === 'DELETE') {
    try {
      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({
          error: 'Ungültige Anfrage',
          message: 'Benachrichtigungs-ID ist erforderlich.'
        });
      }

      // Überprüfen, ob die Benachrichtigung existiert und dem Benutzer gehört
      const { data: notification, error: findError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .eq('user_id', userId)
        .single();

      if (findError || !notification) {
        return res.status(404).json({
          error: 'Nicht gefunden',
          message: 'Benachrichtigung nicht gefunden.'
        });
      }

      // Benachrichtigung löschen
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Fehler beim Löschen der Benachrichtigung:', deleteError);
        return res.status(500).json({
          error: 'Datenbankfehler',
          message: 'Fehler beim Löschen der Benachrichtigung.'
        });
      }

      return res.status(200).json({
        message: 'Benachrichtigung erfolgreich gelöscht.'
      });
    } catch (err) {
      console.error('Unerwarteter Fehler beim Löschen der Benachrichtigung:', err);
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
