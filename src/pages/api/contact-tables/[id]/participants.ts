import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { Database } from '@/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

// Typen für die Datenstrukturen
interface Restaurant {
  userId: string;
}

interface ContactTable {
  id: string;
  restaurant_id: string;
  max_participants: number;
  status: string;
  restaurants?: Restaurant | Restaurant[] | { userId: string } | { userId: string }[];
}

interface ParticipantProfile {
  name?: string;
  email?: string;
}

interface Participant {
  user_id: string;
  status: string;
  created_at: string;
  profiles?: ParticipantProfile | null;
}

interface LimitedParticipant {
  user_id: string;
  name: string;
  status: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Gültige Tisch-ID erforderlich' });
  }

  // Erstelle einen API-kompatiblen Kontext für den Supabase-Client
  const supabaseContext = {
    req,
    res,
    resolvedUrl: `/api/contact-tables/${id}/participants`
  };
  
  const supabase = createClient(supabaseContext);
  
  if (req.method === 'GET') {
    try {
      // Authentifizierung prüfen
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
      }

      // Überprüfen, ob der Benutzer berechtigt ist, die Teilnehmer zu sehen
      const { data: table, error: tableError } = await supabase
        .from('contact_tables')
        .select('restaurant_id, restaurants:restaurant_id(userId)')
        .eq('id', id)
        .single();

      if (tableError) {
        console.error('Fehler beim Abrufen des Kontakttisches:', tableError);
        return res.status(404).json({ error: 'Kontakttisch nicht gefunden' });
      }

      // Typsichere Prüfung des Restaurantbesitzers
      let isRestaurantOwner = false;
      
      if (table.restaurants) {
        // Prüfen, ob restaurants ein Array oder ein einzelnes Objekt ist
        if (Array.isArray(table.restaurants)) {
          // Wenn es ein Array ist, prüfen wir das erste Element
          const firstRestaurant = table.restaurants[0] as unknown as Restaurant;
          isRestaurantOwner = table.restaurants.length > 0 && (firstRestaurant as any).userId === user.id;
        } else {
          // Wenn es ein einzelnes Objekt ist
          const restaurant = table.restaurants as unknown as Restaurant;
          isRestaurantOwner = (restaurant as any).userId === user.id;
        }
      }
      
      const isAdmin = user.user_metadata?.role === 'ADMIN';
      const isParticipant = await checkIfUserIsParticipant(supabase, id, user.id);

      if (!isRestaurantOwner && !isAdmin && !isParticipant) {
        return res.status(403).json({ error: 'Keine Berechtigung zum Anzeigen der Teilnehmer' });
      }

      // Teilnehmer abrufen
      const { data: participants, error: participantsError } = await supabase
        .from('participations')
        .select(`
          user_id,
          status,
          created_at,
          profiles:user_id (
            name,
            email
          )
        `)
        .eq('contact_table_id', id);

      if (participantsError) {
        return res.status(500).json({ error: 'Fehler beim Abrufen der Teilnehmer' });
      }

      // Für normale Teilnehmer nur begrenzte Informationen zurückgeben
      if (!isRestaurantOwner && !isAdmin) {
        const limitedParticipants = participants.map((p: any): LimitedParticipant => {
          let name = 'Anonymer Teilnehmer';
          
          if (p.profiles && typeof p.profiles === 'object' && p.profiles !== null) {
            if ('name' in p.profiles && typeof p.profiles.name === 'string' && p.profiles.name) {
              name = p.profiles.name;
            }
          }
          
          return {
            user_id: p.user_id,
            name,
            status: p.status
          };
        });
        
        return res.status(200).json(limitedParticipants);
      }

      // Für Restaurantbesitzer und Admins alle Informationen zurückgeben
      return res.status(200).json(participants);
    } catch (error: any) {
      console.error('Fehler beim Abrufen der Teilnehmer:', error);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  } else if (req.method === 'POST') {
    try {
      // Authentifizierung prüfen
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
      }

      // Überprüfen, ob der Benutzer der Restaurantbesitzer ist
      const { data: table, error: tableError } = await supabase
        .from('contact_tables')
        .select('restaurant_id, restaurants:restaurant_id(userId), max_participants, status')
        .eq('id', id)
        .single();

      if (tableError) {
        console.error('Fehler beim Abrufen des Kontakttisches:', tableError);
        return res.status(404).json({ error: 'Kontakttisch nicht gefunden' });
      }

      // Typsichere Prüfung des Restaurantbesitzers
      let isRestaurantOwner = false;
      
      if (table.restaurants) {
        // Prüfen, ob restaurants ein Array oder ein einzelnes Objekt ist
        if (Array.isArray(table.restaurants)) {
          // Wenn es ein Array ist, prüfen wir das erste Element
          const firstRestaurant = table.restaurants[0] as unknown as Restaurant;
          isRestaurantOwner = table.restaurants.length > 0 && (firstRestaurant as any).userId === user.id;
        } else {
          // Wenn es ein einzelnes Objekt ist
          const restaurant = table.restaurants as unknown as Restaurant;
          isRestaurantOwner = (restaurant as any).userId === user.id;
        }
      }
      
      const isAdmin = user.user_metadata?.role === 'ADMIN';

      if (!isRestaurantOwner && !isAdmin) {
        return res.status(403).json({ error: 'Keine Berechtigung zum Hinzufügen von Teilnehmern' });
      }

      // Daten aus dem Request-Body extrahieren
      const { user_id, user_email } = req.body;

      if (!user_id && !user_email) {
        return res.status(400).json({ error: 'Benutzer-ID oder E-Mail ist erforderlich' });
      }

      // Prüfen, ob der Tisch voll ist
      const { data: participantsCount, error: countError } = await supabase
        .from('participations')
        .select('*', { count: 'exact', head: true })
        .eq('contact_table_id', id);

      if (countError) {
        console.error('Fehler beim Zählen der Teilnehmer:', countError);
        return res.status(500).json({ error: 'Fehler beim Prüfen der Teilnehmerzahl' });
      }

      const count = participantsCount?.length || 0;
      if (count >= table.max_participants) {
        return res.status(400).json({ error: 'Der Kontakttisch ist bereits voll' });
      }

      // Benutzer-ID finden, falls nur E-Mail angegeben wurde
      let targetUserId = user_id;
      if (!targetUserId && user_email) {
        const { data: userByEmail, error: emailError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', user_email)
          .single();
          
        if (emailError || !userByEmail) {
          return res.status(404).json({ error: 'Benutzer mit dieser E-Mail nicht gefunden' });
        }
        
        targetUserId = userByEmail.id;
      }

      // Prüfen, ob der Benutzer bereits teilnimmt
      const { data: existingParticipation } = await supabase
        .from('participations')
        .select('*')
        .eq('contact_table_id', id)
        .eq('user_id', targetUserId)
        .single();

      if (existingParticipation) {
        return res.status(400).json({ error: 'Dieser Benutzer nimmt bereits am Kontakttisch teil' });
      }

      // Teilnahme erstellen
      const { error: participationError } = await supabase
        .from('participations')
        .insert({
          user_id: targetUserId,
          contact_table_id: id,
          status: 'CONFIRMED'
        });

      if (participationError) {
        return res.status(500).json({ error: 'Fehler beim Hinzufügen des Teilnehmers' });
      }

      // Prüfen, ob der Tisch jetzt voll ist
      const { data: updatedParticipants, error: updateError } = await supabase
        .from('participations')
        .select('*', { count: 'exact' })
        .eq('contact_table_id', id);

      if (updateError) {
        console.error('Fehler beim Aktualisieren des Tischstatus:', updateError);
      } else if (updatedParticipants && updatedParticipants.length >= table.max_participants) {
        await supabase
          .from('contact_tables')
          .update({ status: 'FULL' })
          .eq('id', id);
      }

      return res.status(200).json({ success: true, message: 'Teilnehmer erfolgreich hinzugefügt' });
    } catch (error: any) {
      console.error('Fehler beim Hinzufügen des Teilnehmers:', error);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Hilfsfunktion zum Prüfen, ob ein Benutzer Teilnehmer eines Kontakttisches ist
async function checkIfUserIsParticipant(
  supabase: SupabaseClient<Database>,
  tableId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('participations')
    .select('*')
    .eq('contact_table_id', tableId)
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error('Fehler beim Prüfen der Teilnahme:', error);
    return false;
  }
  
  return !!data;
}
