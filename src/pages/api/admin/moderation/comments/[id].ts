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
  
  // Kommentar-ID aus der Anfrage extrahieren
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Ungültige Kommentar-ID' });
  }
  
  try {
    // GET-Anfrage: Kommentardetails abrufen
    if (req.method === 'GET') {
      // Kommentar mit Benutzerinformationen abrufen
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_id (*)
        `)
        .eq('id', id)
        .single();
      
      if (commentError || !comment) {
        return res.status(404).json({ message: 'Kommentar nicht gefunden' });
      }
      
      // Berichte zu diesem Kommentar abrufen
      const { data: reports, error: reportsError } = await supabase
        .from('comment_reports')
        .select(`
          *,
          reportedBy:reported_by (*)
        `)
        .eq('comment_id', id);
      
      // Zusätzliche Informationen je nach Inhaltstyp abrufen
      let relatedContent = null;
      
      if (comment.content_type === 'REVIEW' && comment.content_id) {
        const { data: reviewContent, error: reviewError } = await supabase
          .from('reviews')
          .select(`
            *,
            restaurant:restaurant_id (*)
          `)
          .eq('id', comment.content_id)
          .single();
          
        if (!reviewError && reviewContent) {
          relatedContent = reviewContent;
        }
      } else if (comment.content_type === 'BLOG' && comment.content_id) {
        const { data: blogContent, error: blogError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', comment.content_id)
          .single();
          
        if (!blogError && blogContent) {
          relatedContent = blogContent;
        }
      }
      
      // Kommentar mit Berichten und zugehörigen Inhalten zurückgeben
      const commentWithReports = {
        ...comment,
        reports: reports || [],
        relatedContent
      };
      
      return res.status(200).json(commentWithReports);
    }
    
    // PATCH-Anfrage: Kommentarstatus aktualisieren
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
      
      // Kommentar aktualisieren
      const { data: updatedComment, error: updateError } = await supabase
        .from('comments')
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
        return res.status(500).json({ message: 'Fehler beim Aktualisieren des Kommentars', error: updateError });
      }
      
      return res.status(200).json(updatedComment);
    }
    
    // DELETE-Anfrage: Kommentar löschen
    if (req.method === 'DELETE') {
      // Zuerst alle Berichte löschen, die mit diesem Kommentar verknüpft sind
      const { error: deleteReportsError } = await supabase
        .from('comment_reports')
        .delete()
        .eq('comment_id', id);
      
      if (deleteReportsError) {
        return res.status(500).json({ message: 'Fehler beim Löschen der Berichte', error: deleteReportsError });
      }
      
      // Dann den Kommentar löschen
      const { error: deleteCommentError } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);
      
      if (deleteCommentError) {
        return res.status(500).json({ message: 'Fehler beim Löschen des Kommentars', error: deleteCommentError });
      }
      
      return res.status(200).json({ message: 'Kommentar erfolgreich gelöscht' });
    }
    
    // Andere Anfragemethoden nicht erlaubt
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Fehler bei der Kommentarmoderation:', error);
    return res.status(500).json({ message: 'Interner Serverfehler', error });
  } finally {
    // Keine Verbindung zu schließen bei Supabase
  }
}
