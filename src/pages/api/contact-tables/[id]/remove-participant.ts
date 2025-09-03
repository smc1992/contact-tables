import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../../utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Gültige Tisch-ID erforderlich' });
  }

  try {
    // Authentifizierung prüfen
    const supabase = createClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Daten aus dem Request-Body extrahieren
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Benutzer-ID ist erforderlich' });
    }

    // Überprüfen, ob der Benutzer berechtigt ist, Teilnehmer zu entfernen
    const { data: table } = await supabase
      .from('contact_tables')
      .select('restaurant_id, restaurants!inner(userId)')
      .eq('id', id)
      .single();

    const isRestaurantOwner = table && table.restaurants.userId === user.id;
    const isAdmin = user.user_metadata.role === 'ADMIN';
    const isSelfRemoval = user_id === user.id;

    if (!isRestaurantOwner && !isAdmin && !isSelfRemoval) {
      return res.status(403).json({ error: 'Keine Berechtigung zum Entfernen dieses Teilnehmers' });
    }

    // Teilnahme löschen
    const { error: deleteError } = await supabase
      .from('participations')
      .delete()
      .eq('contact_table_id', id)
      .eq('user_id', user_id);

    if (deleteError) {
      return res.status(500).json({ error: 'Fehler beim Entfernen des Teilnehmers' });
    }

    // Tischstatus auf OPEN setzen, falls er vorher FULL war
    const { data: tableStatus } = await supabase
      .from('contact_tables')
      .select('status')
      .eq('id', id)
      .single();

    if (tableStatus && tableStatus.status === 'FULL') {
      await supabase
        .from('contact_tables')
        .update({ status: 'OPEN' })
        .eq('id', id);
    }

    return res.status(200).json({ success: true, message: 'Teilnehmer erfolgreich entfernt' });
  } catch (error: any) {
    console.error('Fehler beim Entfernen des Teilnehmers:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}
