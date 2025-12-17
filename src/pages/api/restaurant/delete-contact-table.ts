import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const supabase = createClient({ req, res });

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const userRole = user.user_metadata?.data?.role as string || user.user_metadata?.role as string || 'CUSTOMER';
  if (userRole !== 'RESTAURANT') {
    return res.status(403).json({ message: 'Keine Berechtigung, Contact Tables zu löschen' });
  }

  // Für DELETE-Requests werden Parameter oft über req.query erwartet.
  // Hier wird es konsistent zu den anderen Routen aus req.body gelesen.
  const { tableId, restaurantId } = req.body; 

  if (!tableId || !restaurantId) {
    return res.status(400).json({ message: 'Tisch-ID (tableId) und Restaurant-ID (restaurantId) sind im Body erforderlich' });
  }

  try {
    // Zuerst das Restaurant verifizieren, um sicherzustellen, dass der Benutzer der Eigentümer ist.
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, userId') // is_active ist hier nicht unbedingt nötig für die Löschberechtigung
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({ message: 'Zugehöriges Restaurant nicht gefunden.' });
    }

    if ((restaurant as any).userId !== user.id) {
      return res.status(403).json({ message: 'Keine Berechtigung, auf die Ressourcen dieses Restaurants zuzugreifen.' });
    }

    // Contact Table löschen, aber nur wenn er zum verifizierten Restaurant gehört
    const { error: deleteError, count } = await supabase
      .from('contact_tables')
      .delete()
      .eq('id', tableId)
      .eq('restaurant_id', restaurantId); // Stellt sicher, dass nur der eigene Tisch gelöscht wird

    if (deleteError) {
      console.error('Supabase DB Delete Fehler für contact_tables:', deleteError);
      return res.status(500).json({ message: `Fehler beim Löschen des Contact Tables: ${deleteError.message}` });
    }

    if (count === 0) {
        return res.status(404).json({ message: 'Contact Table nicht gefunden oder bereits gelöscht, oder keine Berechtigung.' });
    }

    // Optional: Überprüfen, ob es Teilnehmer gibt und diese benachrichtigen (nicht implementiert)

    return res.status(200).json({ 
      message: 'Contact Table erfolgreich gelöscht'
    });
  } catch (error: any) {
    console.error('Fehler beim Löschen des Contact Tables:', error);
    return res.status(500).json({ message: error.message || 'Interner Serverfehler' });
  }
}
