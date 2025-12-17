import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const supabase = createClient({ req, res });

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const userRole = user.user_metadata?.data?.role as string || user.user_metadata?.role as string || 'CUSTOMER';
  if (userRole !== 'RESTAURANT') {
    return res.status(403).json({ message: 'Keine Berechtigung, Contact Tables zu aktualisieren' });
  }

  const { 
    tableId, // ID des zu aktualisierenden Contact Tables
    restaurantId, // ID des Restaurants zur Verifizierung
    title, 
    description, 
    maxParticipants,
    status, // Status kann optional auch aktualisiert werden
    paused = false,
    isIndefinite = true,
    pauseStart = null,
    pauseEnd = null,
  } = req.body;

  if (!tableId || !restaurantId || !title || !description || maxParticipants === undefined) {
    return res.status(400).json({ message: 'Alle erforderlichen Felder müssen ausgefüllt sein (tableId, restaurantId, title, description, maxParticipants)' });
  }

  const parsedMaxParticipants = Number(maxParticipants);
  if (isNaN(parsedMaxParticipants) || parsedMaxParticipants < 2) {
    return res.status(400).json({ message: 'Ein Contact Table muss mindestens 2 Teilnehmer haben (maxParticipants)' });
  }

  try {
    // Restaurant in der Datenbank finden und Berechtigung prüfen
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, userId, is_active')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    if ((restaurant as any).userId !== user.id) {
      return res.status(403).json({ message: 'Keine Berechtigung für dieses Restaurant' });
    }

    if (!restaurant.is_active) {
      return res.status(403).json({ message: 'Restaurant ist nicht aktiv. Bitte aktivieren Sie Ihr Restaurant, um Contact Tables zu bearbeiten.' });
    }

    // Pause-Zeitraum validieren, falls pausiert
    if (paused) {
      if (!pauseStart || !pauseEnd) {
        return res.status(400).json({ message: 'Bitte Pausenzeitraum (von/bis) angeben.' });
      }
      const ps = new Date(pauseStart);
      const pe = new Date(pauseEnd);
      if (isNaN(ps.getTime()) || isNaN(pe.getTime())) {
        return res.status(400).json({ message: 'Ungültiges Datumsformat für Pausenzeitraum.' });
      }
      if (pe <= ps) {
        return res.status(400).json({ message: 'Pause bis muss nach Pause von liegen.' });
      }
    }

    const updateData: any = {
      title,
      description,
      max_participants: parsedMaxParticipants,
      paused,
      is_indefinite: isIndefinite,
      updated_at: new Date().toISOString(),
      // Datum/Uhrzeit werden entfernt, Tisch ist unbestimmt aktiv
      datetime: null,
      end_datetime: null,
      pause_start: paused && pauseStart ? pauseStart : null,
      pause_end: paused && pauseEnd ? pauseEnd : null,
    };
    if (status) {
      updateData.status = status;
    }
    // Endzeit-Felder werden nicht mehr verwendet

    const { data: updatedTable, error: updateError } = await supabase
      .from('contact_tables')
      .update(updateData)
      .eq('id', tableId)
      .eq('restaurant_id', restaurantId) // Zusätzliche Sicherheitsprüfung
      .select()
      .single();

    if (updateError) {
      console.error('Supabase DB Update Fehler für contact_tables:', updateError);
      if (updateError.code === 'PGRST204') { // PostgREST code for no rows found
        return res.status(404).json({ message: 'Contact Table nicht gefunden oder keine Berechtigung.' });
      }
      return res.status(500).json({ message: `Fehler beim Aktualisieren des Contact Tables: ${updateError.message}` });
    }
    
    if (!updatedTable) { // Sollte durch .single() und PGRST204 abgedeckt sein, aber als Fallback
        return res.status(404).json({ message: 'Contact Table nach Update nicht gefunden.' });
    }

    const responseTable = {
        ...updatedTable,
        maxParticipants: updatedTable.max_participants,
        currentParticipants: updatedTable.current_participants,
    };
    delete responseTable.max_participants;
    delete responseTable.current_participants;
    delete responseTable.restaurant_id;

    return res.status(200).json({ 
      message: 'Contact Table erfolgreich aktualisiert',
      contactTable: responseTable
    });
  } catch (error: any) {
    console.error('Fehler bei der Aktualisierung des Contact Tables:', error);
    return res.status(500).json({ message: error.message || 'Interner Serverfehler' });
  }
}
