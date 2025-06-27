import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Supabase-Client erstellen
  const supabase = createPagesServerClient({ req, res });

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

  // GET: Benutzerereignisse abrufen
  if (req.method === 'GET') {
    try {
      // Events aus Supabase abrufen
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          restaurant:restaurant_id (
            id,
            name,
            address,
            image_url
          ),
          participants:event_participants (
            user_id,
            status,
            user:user_id (
              id,
              name,
              email
            )
          )
        `)
        .eq('event_participants.user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Fehler beim Abrufen der Events:', error);
        return res.status(500).json({
          error: 'Datenbankfehler',
          message: 'Fehler beim Abrufen der Events.'
        });
      }

      // Wenn keine Events gefunden wurden, Demo-Daten zurückgeben
      if (!events || events.length === 0) {
        // Demo-Events
        const demoEvents = [
          {
            id: 1,
            title: 'Gemeinsames Abendessen',
            restaurant: {
              id: 1,
              name: 'Restaurant Bella Italia',
              address: 'Hauptstraße 123, 10115 Berlin',
              image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cmVzdGF1cmFudHxlbnwwfHwwfHw%3D&w=1000&q=80'
            },
            date: '2025-06-15',
            time: '19:00',
            participants: [
              {
                user_id: userId,
                status: 'confirmed',
                user: {
                  id: userId,
                  name: session.user.user_metadata?.name || 'Benutzer',
                  email: session.user.email
                }
              },
              {
                user_id: '2',
                status: 'confirmed',
                user: {
                  id: '2',
                  name: 'Anna Schmidt',
                  email: 'anna@example.com'
                }
              },
              {
                user_id: '3',
                status: 'confirmed',
                user: {
                  id: '3',
                  name: 'Thomas Müller',
                  email: 'thomas@example.com'
                }
              },
              {
                user_id: '4',
                status: 'confirmed',
                user: {
                  id: '4',
                  name: 'Lisa Weber',
                  email: 'lisa@example.com'
                }
              }
            ],
            status: 'confirmed'
          },
          {
            id: 2,
            title: 'Mittagessen mit neuen Kontakten',
            restaurant: {
              id: 2,
              name: 'Sushi Palace',
              address: 'Friedrichstraße 45, 10117 Berlin',
              image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8c3VzaGl8ZW58MHx8MHx8&w=1000&q=80'
            },
            date: '2025-06-20',
            time: '12:30',
            participants: [
              {
                user_id: userId,
                status: 'pending',
                user: {
                  id: userId,
                  name: session.user.user_metadata?.name || 'Benutzer',
                  email: session.user.email
                }
              },
              {
                user_id: '5',
                status: 'confirmed',
                user: {
                  id: '5',
                  name: 'Julia Fischer',
                  email: 'julia@example.com'
                }
              },
              {
                user_id: '6',
                status: 'pending',
                user: {
                  id: '6',
                  name: 'Michael Schneider',
                  email: 'michael@example.com'
                }
              }
            ],
            status: 'pending'
          }
        ];

        return res.status(200).json({
          data: {
            events: demoEvents
          },
          message: 'Demo-Events zurückgegeben.'
        });
      }

      return res.status(200).json({
        data: {
          events
        },
        message: 'Events erfolgreich abgerufen.'
      });
    } catch (err) {
      console.error('Unerwarteter Fehler beim Abrufen der Events:', err);
      return res.status(500).json({
        error: 'Serverfehler',
        message: 'Ein unerwarteter Fehler ist aufgetreten.'
      });
    }
  }

  // POST: Neues Event erstellen
  if (req.method === 'POST') {
    try {
      const { title, restaurantId, date, time, maxParticipants, description } = req.body;

      // Validierung
      if (!title || !restaurantId || !date || !time || !maxParticipants) {
        return res.status(400).json({
          error: 'Ungültige Anfrage',
          message: 'Titel, Restaurant-ID, Datum, Uhrzeit und maximale Teilnehmerzahl sind erforderlich.'
        });
      }

      // Event erstellen
      const { data: event, error } = await supabase
        .from('events')
        .insert({
          title,
          restaurant_id: restaurantId,
          date,
          time,
          max_participants: maxParticipants,
          description,
          created_by: userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Fehler beim Erstellen des Events:', error);
        return res.status(500).json({
          error: 'Datenbankfehler',
          message: 'Fehler beim Erstellen des Events.'
        });
      }

      // Ersteller als Teilnehmer hinzufügen
      const { error: participantError } = await supabase
        .from('event_participants')
        .insert({
          event_id: event.id,
          user_id: userId,
          status: 'confirmed',
          joined_at: new Date().toISOString()
        });

      if (participantError) {
        console.error('Fehler beim Hinzufügen des Teilnehmers:', participantError);
        return res.status(500).json({
          error: 'Datenbankfehler',
          message: 'Fehler beim Hinzufügen des Teilnehmers.'
        });
      }

      return res.status(201).json({
        data: event,
        message: 'Event erfolgreich erstellt.'
      });
    } catch (err) {
      console.error('Unerwarteter Fehler beim Erstellen des Events:', err);
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
