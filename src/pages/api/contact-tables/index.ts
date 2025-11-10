import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../utils/supabase/server';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient({ req, res });
  
  if (req.method === 'GET') {
    try {
      // Authentifizierung prüfen (optional)
      const { data: { user } } = await supabase.auth.getUser();
      
      // Query-Parameter extrahieren
      const {
        restaurant_id,
        status,
        is_public,
        min_date,
        max_date,
        limit = 20,
        offset = 0,
        sort_by = 'datetime',
        sort_order = 'asc'
      } = req.query;

      // Query aufbauen
      let query = supabase
        .from('contact_tables')
        .select(`
          *,
          restaurant:restaurant_id (
            id,
            name,
            address,
            city,
            image_url,
            is_visible,
            is_active,
            contract_status
          ),
          participations (
            user_id
          )
        `);

      // Filter anwenden
      if (restaurant_id) {
        query = query.eq('restaurant_id', restaurant_id);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (is_public !== undefined) {
        query = query.eq('is_public', is_public === 'true');
      } else {
        // Standardmäßig nur öffentliche Tische anzeigen, es sei denn, der Benutzer ist authentifiziert
        if (!user) {
          query = query.eq('is_public', true);
        }
      }
      
      if (min_date) {
        query = query.gte('datetime', min_date);
      }
      
      if (max_date) {
        query = query.lte('datetime', max_date);
      }

      // Sortierung und Paginierung
      query = query.order(sort_by as string, { ascending: sort_order === 'asc' })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      // Abfrage ausführen
      const { data: tables, error, count } = await query;

      if (error) {
        return res.status(500).json({ error: 'Fehler beim Abrufen der Kontakttische' });
      }

      // Verarbeite die Ergebnisse, um zusätzliche Informationen hinzuzufügen
      const processedTablesRaw = tables ?? [];
      const processedTables = processedTablesRaw.map((table: any) => {
        const currentParticipants = table.participations?.length || 0;
        let isParticipating = false;
        
        if (user) {
          isParticipating = table.participations?.some(
            (p: any) => p.user_id === user.id
          ) || false;
        }
        
        const output = {
          ...table,
          current_participants: currentParticipants,
          is_participating: isParticipating,
          is_full: currentParticipants >= table.max_participants
        } as any;

        // Flag: öffentlich bereit nach Restaurant-Status
        const r = table.restaurant || {};
        const isRestaurantPublicReady = Boolean(
          r && r.is_visible === true && r.is_active === true && r.contract_status === 'ACTIVE'
        );
        (output as any).is_public_ready = table.is_public === true && isRestaurantPublicReady;
        return output;
      });

      // Für nicht authentifizierte Nutzer nur öffentlich bereit zurückgeben
      const finalTables = !user
        ? processedTables.filter((t: any) => t.is_public_ready)
        : processedTables;

      return res.status(200).json({
        data: finalTables,
        meta: {
          total: count,
          limit: Number(limit),
          offset: Number(offset)
        }
      });
    } catch (error: any) {
      console.error('Fehler beim Abrufen der Kontakttische:', error);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  } else if (req.method === 'POST') {
    try {
      // Authentifizierung prüfen
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
      }

      // Daten aus dem Request-Body extrahieren
      const { 
        title, 
        description, 
        datetime = null, 
        end_datetime = null,
        max_participants, 
        price, 
        restaurant_id, 
        is_public = true,
        paused = false,
        is_indefinite = true,
        pause_start = null,
        pause_end = null,
      } = req.body;

      // Pflichtfelder prüfen
      if (!title || !max_participants || !restaurant_id) {
        return res.status(400).json({ 
          error: 'Titel, maximale Teilnehmerzahl und Restaurant-ID sind erforderlich' 
        });
      }

      // Endzeit validieren (optional)
      if (end_datetime && datetime) {
        const start = new Date(datetime);
        const end = new Date(end_datetime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({ error: 'Ungültiges Datumsformat für Start- oder Endzeit' });
        }
        if (end <= start) {
          return res.status(400).json({ error: 'Endzeit muss nach der Startzeit liegen' });
        }
      }

      // Pause-Zeitraum validieren (optional)
      if (paused) {
        if (!pause_start || !pause_end) {
          return res.status(400).json({ error: 'Bitte Pausenzeitraum (von/bis) angeben' });
        }
        const ps = new Date(pause_start);
        const pe = new Date(pause_end);
        if (isNaN(ps.getTime()) || isNaN(pe.getTime())) {
          return res.status(400).json({ error: 'Ungültiges Datumsformat für Pausenzeitraum' });
        }
        if (pe <= ps) {
          return res.status(400).json({ error: 'Pause bis muss nach Pause von liegen' });
        }
      }

      // Überprüfen, ob der Benutzer der Restaurantbesitzer ist
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('userId')
        .eq('id', restaurant_id)
        .single();

      if (restaurantError || !restaurant) {
        return res.status(404).json({ error: 'Restaurant nicht gefunden' });
      }

      if ((restaurant as any).userId !== user.id) {
        const isAdmin = user.user_metadata.role === 'ADMIN';
        if (!isAdmin) {
          return res.status(403).json({ error: 'Keine Berechtigung zum Erstellen eines Kontakttisches für dieses Restaurant' });
        }
      }

      // Kontakttisch erstellen
      // Einige Projekte haben keinen Default für die Spalte `id`; daher generieren wir eine UUID clientseitig.
      const generatedId = randomUUID();
      const { data: newTable, error: insertError } = await supabase
        .from('contact_tables')
        .insert({
          id: generatedId,
          title,
          description,
          datetime,
          end_datetime,
          max_participants,
          price: price || 0,
          restaurant_id,
          status: 'OPEN',
          is_public,
          paused,
          is_indefinite,
          pause_start,
          pause_end
        })
        .select()
        .single();

      if (insertError) {
        // Detailierte Fehlerausgabe zur einfacheren Fehlersuche im Frontend
        return res.status(500).json({ 
          error: 'Fehler beim Erstellen des Kontakttisches',
          details: insertError?.message || insertError
        });
      }

      return res.status(201).json({ 
        success: true, 
        message: 'Kontakttisch erfolgreich erstellt', 
        data: newTable 
      });
    } catch (error: any) {
      console.error('Fehler beim Erstellen des Kontakttisches:', error);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
