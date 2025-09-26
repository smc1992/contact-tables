import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Nur POST-Anfragen zulassen
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    // Daten aus der Anfrage extrahieren
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage', 
        details: 'E-Mail-Adresse muss angegeben werden.' 
      });
    }
    
    // Für signup-Links ist ein Passwort erforderlich
    // Wenn keines übergeben wurde, verwenden wir ein temporäres
    const tempPassword = password || 'Temp1234!'; // Temporäres Passwort nur für die Link-Generierung

    // Admin-Client initialisieren
    const supabaseAdmin = createAdminClient();
    
    // Überprüfen, ob die Site-URL konfiguriert ist
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      console.error('NEXT_PUBLIC_SITE_URL ist nicht definiert');
      return res.status(500).json({ error: 'Server-Konfigurationsfehler' });
    }

    // E-Mail-Bestätigung senden
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password: tempPassword, // Erforderlich für signup-Links
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    });

    if (error) {
      console.error('Fehler beim Senden der Bestätigungs-E-Mail:', error);
      return res.status(400).json({ 
        error: 'E-Mail-Versand fehlgeschlagen', 
        details: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Bestätigungs-E-Mail wurde gesendet',
      email
    });

  } catch (error: any) {
    console.error('Unerwarteter Fehler beim Senden der Bestätigungs-E-Mail:', error);
    return res.status(500).json({ 
      error: 'Serverfehler beim E-Mail-Versand', 
      details: error.message || 'Unbekannter Fehler'
    });
  }
}
