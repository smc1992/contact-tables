import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur POST und GET Methoden erlauben
  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Supabase Client erstellen
  const supabase = createClient({ req, res });

  // Authentifizierung prüfen
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  // Prüfen, ob der Benutzer ein Admin ist
  if (user.user_metadata?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  try {
    // GET: Benachrichtigungen abrufen
    if (req.method === 'GET') {
      const { limit = 20, offset = 0, unreadOnly } = req.query;
      
      let query = supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);
      
      if (unreadOnly === 'true') {
        query = query.eq('read', false);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Fehler beim Abrufen der Benachrichtigungen:', error);
        return res.status(500).json({ error: 'Fehler beim Abrufen der Benachrichtigungen' });
      }
      
      return res.status(200).json({ notifications: data, count });
    }
    
    // POST: Neue Benachrichtigung erstellen
    if (req.method === 'POST') {
      const { type, title, message, action_url, action_text } = req.body;
      
      if (!type || !title || !message) {
        return res.status(400).json({ error: 'Typ, Titel und Nachricht sind erforderlich' });
      }
      
      const { data, error } = await supabase
        .from('admin_notifications')
        .insert([
          { 
            type, 
            title, 
            message, 
            action_url, 
            action_text,
            read: false,
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) {
        console.error('Fehler beim Erstellen der Benachrichtigung:', error);
        return res.status(500).json({ error: 'Fehler beim Erstellen der Benachrichtigung' });
      }
      
      return res.status(201).json({ notification: data[0] });
    }
    
    // PATCH: Benachrichtigung(en) als gelesen markieren
    if (req.method === 'PATCH') {
      const { id, markAll } = req.body;
      
      if (markAll) {
        // Alle Benachrichtigungen als gelesen markieren
        const { error } = await supabase
          .from('admin_notifications')
          .update({ read: true })
          .eq('read', false);
        
        if (error) {
          console.error('Fehler beim Markieren aller Benachrichtigungen als gelesen:', error);
          return res.status(500).json({ error: 'Fehler beim Markieren aller Benachrichtigungen als gelesen' });
        }
        
        return res.status(200).json({ success: true, message: 'Alle Benachrichtigungen als gelesen markiert' });
      } else if (id) {
        // Einzelne Benachrichtigung als gelesen markieren
        const { error } = await supabase
          .from('admin_notifications')
          .update({ read: true })
          .eq('id', id);
        
        if (error) {
          console.error('Fehler beim Markieren der Benachrichtigung als gelesen:', error);
          return res.status(500).json({ error: 'Fehler beim Markieren der Benachrichtigung als gelesen' });
        }
        
        return res.status(200).json({ success: true, message: 'Benachrichtigung als gelesen markiert' });
      } else {
        return res.status(400).json({ error: 'ID oder markAll Parameter erforderlich' });
      }
    }
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}
