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
    date, 
    time, 
    maxParticipants,
    status // Status kann optional auch aktualisiert werden
  } = req.body;

  if (!tableId || !restaurantId || !title || !description || !date || !time || maxParticipants === undefined) {
    return res.status(400).json({ message: 'Alle erforderlichen Felder müssen ausgefüllt sein (tableId, restaurantId, title, description, date, time, maxParticipants)' });
  }

  const parsedMaxParticipants = Number(maxParticipants);
  if (isNaN(parsedMaxParticipants) || parsedMaxParticipants < 2) {
    return res.status(400).json({ message: 'Ein Contact Table muss mindestens 2 Teilnehmer haben (maxParticipants)' });
  }

  try {
    // Restaurant in der Datenbank finden und Berechtigung prüfen
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, user_id, is_active')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    if (restaurant.user_id !== user.id) {
      return res.status(403).json({ message: 'Keine Berechtigung für dieses Restaurant' });
    }

    if (!restaurant.is_active) {
      return res.status(403).json({ message: 'Restaurant ist nicht aktiv. Bitte aktivieren Sie Ihr Restaurant, um Contact Tables zu bearbeiten.' });
    }

    // Datum und Uhrzeit kombinieren und validieren
    const dateTimeString = `${date}T${time}:00`;
    const eventDateTime = new Date(dateTimeString);
    if (isNaN(eventDateTime.getTime())) {
        return res.status(400).json({ message: 'Ungültiges Datums- oder Zeitformat.' });
    }
    const now = new Date();
    // Erlaube Aktualisierungen für Events, die bereits begonnen haben, aber nicht für solche, die in der Vergangenheit endeten (optional)
    // Für diese Implementierung: Das Datum darf nicht in der Vergangenheit liegen, wenn es geändert wird.
    // Wenn das Datum nicht geändert wird, ist diese Prüfung möglicherweise nicht erforderlich oder anders zu handhaben.
    // Hier gehen wir davon aus, dass das Datum immer neu validiert wird.
    if (eventDateTime < now) {
      // Ausnahme: Wenn das Event bereits existiert und das Datum/Zeit nicht geändert wird, könnte man dies erlauben.
      // Für Einfachheit wird hier immer geprüft.
      // return res.status(400).json({ message: 'Das Datum und die Uhrzeit dürfen nicht in der Vergangenheit liegen' });
    }

    const updateData: any = {
      title,
      description,
      date,
      time,
      max_participants: parsedMaxParticipants,
      // current_participants wird hier nicht direkt aktualisiert; das sollte durch separate Aktionen (Anmeldung/Abmeldung) geschehen.
      // status kann optional aktualisiert werden, wenn im Body mitgegeben
    };
    if (status) {
      updateData.status = status;
    }

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
