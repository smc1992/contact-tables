import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

/**
 * Middleware für die Authentifizierung und Autorisierung von Admin-Benutzern in API-Routen
 * 
 * @param handler - Der API-Handler, der nach erfolgreicher Authentifizierung ausgeführt werden soll
 * @returns Eine Funktion, die den API-Handler mit Authentifizierung umschließt
 */
export function withAdminAuth(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Erstelle Supabase-Client mit Cookies aus dem Request
      const supabase = createClient(req);
      
      // Hole den aktuellen Benutzer
      const { data: { user }, error } = await supabase.auth.getUser();
      
      // Wenn kein Benutzer gefunden wurde oder ein Fehler auftritt
      if (error || !user) {
        console.error('Auth error:', error);
        return res.status(401).json({ 
          error: 'Nicht authentifiziert',
          message: 'Sie müssen angemeldet sein, um auf diese Ressource zuzugreifen.'
        });
      }
      
      // Prüfe, ob der Benutzer Admin-Rechte hat
      const isAdmin = user.user_metadata?.role === 'ADMIN';
      
      if (!isAdmin) {
        return res.status(403).json({ 
          error: 'Nicht autorisiert',
          message: 'Sie haben keine Berechtigung, auf diese Ressource zuzugreifen.'
        });
      }
      
      // Wenn der Benutzer authentifiziert und autorisiert ist, führe den Handler aus
      // und übergebe den Benutzer als zusätzlichen Parameter
      return handler(req, res, user);
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return res.status(500).json({ 
        error: 'Serverfehler',
        message: 'Bei der Verarbeitung Ihrer Anfrage ist ein Fehler aufgetreten.'
      });
    }
  };
}
