import { NextApiRequest, NextApiResponse } from 'next';

import { createClient } from '@/utils/supabase/server';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Der Benutzer wurde bereits durch withAuth authentifiziert
  const user = (req as any).user;
  
  // PUT: Benutzerprofil aktualisieren
  if (req.method === 'PUT') {
    try {
      const { name } = req.body;

      // Validierung
      if (!name) {
        return res.status(400).json({ error: { message: 'Name ist erforderlich' } });
      }

      // Supabase-Client erstellen
      const supabase = createClient({ req, res });
      
      // Benutzermetadaten aktualisieren
      const { data, error } = await supabase.auth.updateUser({
        data: {
          name,
          // Bestehende Metadaten beibehalten
          ...user.user_metadata,
        }
      });

      if (error) {
        console.error('Fehler beim Aktualisieren des Benutzerprofils:', error);
        return res.status(500).json({ error: { message: error.message } });
      }

      return res.status(200).json({
        message: 'Profil erfolgreich aktualisiert',
        user: data.user
      });
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Benutzerprofils:', error);
      return res.status(500).json({ 
        error: { 
          message: 'Interner Serverfehler', 
          details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        }
      });
    }
  }

  // Andere HTTP-Methoden nicht erlaubt
  return res.status(405).json({ error: { message: 'Method not allowed' } });
}

// Export der Handler-Funktion mit dem withAuth-Middleware
export default handler;
