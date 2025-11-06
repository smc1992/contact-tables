import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const supabase = createClient({ req, res });

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const userRole = user.user_metadata?.data?.role as string || user.user_metadata?.role as string || 'CUSTOMER';
  if (userRole !== 'RESTAURANT') {
    return res.status(403).json({ message: 'Keine Berechtigung, Contact Tables zu erstellen' });
  }

  const { 
    restaurantId, 
    title, 
    description, 
    date, 
    time, 
    maxParticipants 
  } = req.body;

  if (!restaurantId || !title || !description || !date || !time || maxParticipants === undefined) {
    return res.status(400).json({ message: 'Alle erforderlichen Felder müssen ausgefüllt sein (restaurantId, title, description, date, time, maxParticipants)' });
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
      return res.status(403).json({ message: 'Restaurant ist nicht aktiv. Bitte aktivieren Sie Ihr Restaurant, um Contact Tables zu erstellen.' });
    }

    // Datum und Uhrzeit kombinieren und validieren
    // Es wird angenommen, dass date im Format 'YYYY-MM-DD' und time im Format 'HH:MM' kommt.
    const dateTimeString = `${date}T${time}:00`;
    const eventDateTime = new Date(dateTimeString);

    if (isNaN(eventDateTime.getTime())) {
        return res.status(400).json({ message: 'Ungültiges Datums- oder Zeitformat.' });
    }
    
    // Zeitunterschied zur lokalen Zeitzone berücksichtigen, um sicherzustellen, dass der Vergleich korrekt ist.
    // Alternativ: Speichere alles in UTC und konvertiere nur für die Anzeige.
    const now = new Date();
    if (eventDateTime < now) {
      return res.status(400).json({ message: 'Das Datum und die Uhrzeit dürfen nicht in der Vergangenheit liegen' });
    }

    // Contact Table in der Datenbank erstellen
    const newTableData = {
      restaurant_id: restaurantId,
      title,
      description,
      date, // Als ISO-String oder Date-Typ speichern, je nach DB-Schema
      time, // Als String oder Time-Typ speichern
      max_participants: parsedMaxParticipants,
      current_participants: 0, // Standardwert
      status: 'OPEN', // Standardwert
      // id wird von Supabase automatisch generiert (wenn als UUID mit Default konfiguriert)
      // created_at und updated_at werden von Supabase automatisch gesetzt (wenn Timestamps mit Default now() konfiguriert)
    };

    const { data: createdTable, error: insertError } = await supabase
      .from('contact_tables') // Annahme: Tabellenname ist 'contact_tables'
      .insert(newTableData)
      .select()
      .single();

    if (insertError) {
      console.error('Supabase DB Insert Fehler für contact_tables:', insertError);
      return res.status(500).json({ message: `Fehler beim Erstellen des Contact Tables: ${insertError.message}` });
    }

    // Daten an das Frontend-Format anpassen (z.B. max_participants zu maxParticipants)
    const responseTable = {
        ...createdTable,
        maxParticipants: createdTable.max_participants,
        currentParticipants: createdTable.current_participants,
    };
    delete responseTable.max_participants;
    delete responseTable.current_participants;
    delete responseTable.restaurant_id; // Normalerweise nicht im Frontend benötigt für die Tabellenliste

    return res.status(201).json({ 
      message: 'Contact Table erfolgreich erstellt',
      contactTable: responseTable 
    });
  } catch (error: any) {
    console.error('Fehler bei der Erstellung des Contact Tables:', error);
    return res.status(500).json({ message: error.message || 'Interner Serverfehler' });
  }
}
