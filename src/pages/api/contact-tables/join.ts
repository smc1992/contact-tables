import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentifizierung prüfen
    const supabase = createClient({ req, res });
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

    // Dynamische Spalte für participations ermitteln (contact_table_id vs event_id)
    const column = await resolveParticipationIdColumn(supabase);

    // Teilnahme erstellen
    const payload: any = { user_id: user.id, status: 'CONFIRMED' };
    payload[column] = tableId;
    const { error: participationError } = await supabase
      .from('participations')
      .insert(payload);

    if (participationError) {
      return res.status(500).json({ error: 'Fehler beim Erstellen der Teilnahme' });
    }

    // Prüfen, ob der Tisch jetzt voll ist und ggf. Status aktualisieren
    const { data: updatedParticipations } = await supabase
      .from('participations')
      .select('*')
      .eq(column, tableId);

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

// Hilfsfunktion: prüft, welche Spalte existiert (contact_table_id oder event_id)
async function resolveParticipationIdColumn(supabase: ReturnType<typeof createClient>): Promise<'contact_table_id' | 'event_id'> {
  try {
    const { error } = await supabase
      .from('participations')
      .select('contact_table_id', { head: true, count: 'exact' })
      .limit(1);
    if (!error) return 'contact_table_id';
    const msg = (error?.message || '').toLowerCase();
    if (msg.includes('could not find') || msg.includes('column') || msg.includes('schema')) {
      return 'event_id';
    }
    return 'contact_table_id';
  } catch (_) {
    return 'event_id';
  }
}
