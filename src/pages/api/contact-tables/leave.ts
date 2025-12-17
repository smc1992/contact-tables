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

    // Prüfen, ob der Benutzer am Tisch teilnimmt
    const { data: participation, error: participationError } = await supabase
      .from('participations')
      .select('*')
      .eq('contact_table_id', tableId)
      .eq('user_id', user.id)
      .single();

    if (participationError || !participation) {
      return res.status(404).json({ error: 'Du nimmst nicht an diesem Kontakttisch teil' });
    }

    // Teilnahme löschen
    const { error: deleteError } = await supabase
      .from('participations')
      .delete()
      .eq('contact_table_id', tableId)
      .eq('user_id', user.id);

    if (deleteError) {
      return res.status(500).json({ error: 'Fehler beim Verlassen des Kontakttisches' });
    }

    // Tischstatus auf OPEN setzen, falls er vorher FULL war
    const { data: table } = await supabase
      .from('contact_tables')
      .select('status')
      .eq('id', tableId)
      .single();

    if (table && table.status === 'FULL') {
      await supabase
        .from('contact_tables')
        .update({ status: 'OPEN' })
        .eq('id', tableId);
    }

    return res.status(200).json({ success: true, message: 'Kontakttisch erfolgreich verlassen' });
  } catch (error: any) {
    console.error('Fehler beim Verlassen des Kontakttisches:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}
