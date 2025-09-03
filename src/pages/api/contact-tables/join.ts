import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentifizierung prüfen
    const supabase = createClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Daten aus dem Request-Body extrahieren
    const { tableId } = req.body;

    if (!tableId) {
      return res.status(400).json({ error: 'Tisch-ID ist erforderlich' });
    }

    // Prüfen, ob der Tisch existiert und verfügbar ist
    const { data: table, error: tableError } = await supabase
      .from('contact_tables')
      .select('*, participations(user_id)')
      .eq('id', tableId)
      .single();

    if (tableError || !table) {
      return res.status(404).json({ error: 'Kontakttisch nicht gefunden' });
    }

    // Prüfen, ob der Tisch noch offen ist
    if (table.status !== 'OPEN') {
      return res.status(400).json({ error: 'Dieser Kontakttisch ist nicht mehr verfügbar' });
    }

    // Prüfen, ob der Benutzer bereits teilnimmt
    const isAlreadyParticipating = table.participations?.some(
      (p: any) => p.user_id === user.id
    );

    if (isAlreadyParticipating) {
      return res.status(400).json({ error: 'Du nimmst bereits an diesem Kontakttisch teil' });
    }

    // Prüfen, ob der Tisch voll ist
    const currentParticipants = table.participations?.length || 0;
    if (currentParticipants >= table.max_participants) {
      // Tisch als voll markieren
      await supabase
        .from('contact_tables')
        .update({ status: 'FULL' })
        .eq('id', tableId);
        
      return res.status(400).json({ error: 'Dieser Kontakttisch ist bereits voll' });
    }

    // Teilnahme erstellen
    const { error: participationError } = await supabase
      .from('participations')
      .insert({
        user_id: user.id,
        contact_table_id: tableId,
        status: 'CONFIRMED'
      });

    if (participationError) {
      return res.status(500).json({ error: 'Fehler beim Erstellen der Teilnahme' });
    }

    // Prüfen, ob der Tisch jetzt voll ist und ggf. Status aktualisieren
    const { data: updatedParticipations } = await supabase
      .from('participations')
      .select('*')
      .eq('contact_table_id', tableId);

    if (updatedParticipations && updatedParticipations.length >= table.max_participants) {
      await supabase
        .from('contact_tables')
        .update({ status: 'FULL' })
        .eq('id', tableId);
    }

    return res.status(200).json({ success: true, message: 'Erfolgreich am Kontakttisch angemeldet' });
  } catch (error: any) {
    console.error('Fehler beim Beitreten zum Kontakttisch:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}
