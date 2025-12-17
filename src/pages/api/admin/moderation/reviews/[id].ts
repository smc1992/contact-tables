import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Supabase-Client erstellen
  const supabase = createClient({ req, res });
  
  // Authentifizierung prüfen
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  // Prüfen, ob der Benutzer ein Admin ist
  if (user.user_metadata?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Keine Berechtigung' });
  }
  
  // Bewertungs-ID aus der Anfrage extrahieren
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Ungültige Bewertungs-ID' });
  }
  
  try {
    // GET-Anfrage: Bewertungsdetails abrufen
    if (req.method === 'GET') {
      // Bewertung mit Benutzer- und Restaurantinformationen abrufen
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select(`
          *,
          user:user_id (*),
          restaurant:restaurant_id (*)
        `)
        .eq('id', id)
        .single();
      
      if (reviewError || !review) {
        return res.status(404).json({ message: 'Bewertung nicht gefunden' });
      }
      
      // Berichte zu dieser Bewertung abrufen
      const { data: reports, error: reportsError } = await supabase
        .from('review_reports')
        .select(`
          *,
          reportedBy:reported_by (*)
        `)
        .eq('review_id', id);
      
      // Bewertung mit Berichten zurückgeben
      const reviewWithReports = {
        ...review,
        reports: reports || []
      };
      
      return res.status(200).json(reviewWithReports);
    }
    
    // PATCH-Anfrage: Bewertungsstatus aktualisieren
    if (req.method === 'PATCH') {
      const { status, adminComment } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status ist erforderlich' });
      }
      
      // Gültige Status-Werte prüfen
      const validStatuses = ['APPROVED', 'REJECTED', 'PENDING', 'FLAGGED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Ungültiger Status' });
      }
      
      // Bewertung aktualisieren
      const { data: updatedReview, error: updateError } = await supabase
        .from('reviews')
        .update({
          status,
          admin_comment: adminComment || null,
          moderated_at: new Date().toISOString(),
          moderated_by: user.id
        })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        return res.status(500).json({ message: 'Fehler beim Aktualisieren der Bewertung', error: updateError });
      }
      
      return res.status(200).json(updatedReview);
    }
    
    // DELETE-Anfrage: Bewertung löschen
    if (req.method === 'DELETE') {
      // Zuerst alle Berichte löschen, die mit dieser Bewertung verknüpft sind
      const { error: deleteReportsError } = await supabase
        .from('review_reports')
        .delete()
        .eq('review_id', id);
      
      if (deleteReportsError) {
        return res.status(500).json({ message: 'Fehler beim Löschen der Berichte', error: deleteReportsError });
      }
      
      // Dann die Bewertung löschen
      const { error: deleteReviewError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);
      
      if (deleteReviewError) {
        return res.status(500).json({ message: 'Fehler beim Löschen der Bewertung', error: deleteReviewError });
      }
      
      return res.status(200).json({ message: 'Bewertung erfolgreich gelöscht' });
    }
    
    // Andere Anfragemethoden nicht erlaubt
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Fehler bei der Bewertungsmoderation:', error);
    return res.status(500).json({ message: 'Interner Serverfehler', error });
  } finally {
    // Keine Verbindung zu schließen bei Supabase
  }
}
