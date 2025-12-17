import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Gültige Tisch-ID erforderlich' });
  }

  const supabase = createClient({ req, res });
  
  if (req.method === 'GET') {
    try {
      // Authentifizierung prüfen
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // Tischinformationen abrufen
      const { data: table, error: tableError } = await supabase
        .from('contact_tables')
        .select(`
          *,
          restaurant:restaurant_id (
            id, 
            name, 
            address, 
            city, 
            postal_code,
            image_url
          ),
          participations (
            user_id,
            status,
            profiles:user_id (
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (tableError || !table) {
        return res.status(404).json({ error: 'Kontakttisch nicht gefunden' });
      }

      // Prüfen, ob der Benutzer teilnimmt (falls authentifiziert)
      let isParticipating = false;
      if (user) {
        isParticipating = table.participations?.some(
          (p: any) => p.user_id === user.id
        ) || false;
      }

      // Anzahl der aktuellen Teilnehmer
      const currentParticipants = table.participations?.length || 0;
      
      // Informationen zurückgeben
      return res.status(200).json({
        ...table,
        current_participants: currentParticipants,
        is_participating: isParticipating,
        is_full: currentParticipants >= table.max_participants,
        can_join: user && !isParticipating && currentParticipants < table.max_participants && table.status === 'OPEN'
      });
    } catch (error: any) {
      console.error('Fehler beim Abrufen des Kontakttisches:', error);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      // Authentifizierung und Berechtigung prüfen
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
      }

      // Überprüfen, ob der Benutzer der Restaurantbesitzer ist
      const { data: table } = await supabase
        .from('contact_tables')
        .select('restaurant_id, restaurant:restaurant_id(userId)')
        .eq('id', id)
        .single();

      if (!table || (table.restaurant as any)?.userId !== user.id) {
        const isAdmin = user.user_metadata.role === 'ADMIN';
        if (!isAdmin) {
          return res.status(403).json({ error: 'Keine Berechtigung zum Bearbeiten dieses Kontakttisches' });
        }
      }

      // Daten aktualisieren
      const { title, description, datetime, max_participants, price, status, is_public } = req.body;
      
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (datetime !== undefined) updateData.datetime = datetime;
      if (max_participants !== undefined) updateData.max_participants = max_participants;
      if (price !== undefined) updateData.price = price;
      if (status !== undefined) updateData.status = status;
      if (is_public !== undefined) updateData.is_public = is_public;

      const { error: updateError } = await supabase
        .from('contact_tables')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        return res.status(500).json({ error: 'Fehler beim Aktualisieren des Kontakttisches' });
      }

      return res.status(200).json({ success: true, message: 'Kontakttisch erfolgreich aktualisiert' });
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Kontakttisches:', error);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Authentifizierung und Berechtigung prüfen
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
      }

      // Überprüfen, ob der Benutzer der Restaurantbesitzer ist
      const { data: table } = await supabase
        .from('contact_tables')
        .select('restaurant_id, restaurant:restaurant_id(userId)')
        .eq('id', id)
        .single();

      if (!table || (table.restaurant as any)?.userId !== user.id) {
        const isAdmin = user.user_metadata.role === 'ADMIN';
        if (!isAdmin) {
          return res.status(403).json({ error: 'Keine Berechtigung zum Löschen dieses Kontakttisches' });
        }
      }

      // Kontakttisch löschen
      const { error: deleteError } = await supabase
        .from('contact_tables')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return res.status(500).json({ error: 'Fehler beim Löschen des Kontakttisches' });
      }

      return res.status(200).json({ success: true, message: 'Kontakttisch erfolgreich gelöscht' });
    } catch (error: any) {
      console.error('Fehler beim Löschen des Kontakttisches:', error);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
