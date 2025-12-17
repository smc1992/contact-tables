import { createAdminClient } from '../supabase/server';

/**
 * Sendet eine Bestätigungs-E-Mail an die angegebene E-Mail-Adresse
 * Diese Funktion verwendet die Supabase Admin API, um einen Bestätigungslink zu generieren
 * und zu senden, auch wenn die automatische E-Mail-Bestätigung fehlschlägt.
 * 
 * @param email Die E-Mail-Adresse des Benutzers
 * @returns Ein Promise mit dem Ergebnis des E-Mail-Versands
 */
export async function sendConfirmationEmail(email: string): Promise<{ success: boolean; message: string; email: string }> {
  try {
    // Admin-Client erstellen
    const adminClient = createAdminClient();
    
    // Site-URL für Redirect abrufen
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      console.error('NEXT_PUBLIC_SITE_URL ist nicht definiert');
      return { 
        success: false, 
        message: 'Server-Konfigurationsfehler: NEXT_PUBLIC_SITE_URL fehlt', 
        email 
      };
    }
    
    // Bestätigungslink generieren und senden
    // Wir verwenden ein temporäres Passwort für die Link-Generierung
    // Das tatsächliche Passwort wird später vom Benutzer gesetzt
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase().slice(-2) + '!1';
    
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'signup',
      email,
      password: tempPassword,
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    });
    
    if (error) {
      console.error('Fehler beim Generieren des Bestätigungslinks:', error);
      return { 
        success: false, 
        message: `Fehler beim Senden der Bestätigungs-E-Mail: ${error.message}`, 
        email 
      };
    }
    
    console.log('Bestätigungslink erfolgreich gesendet an:', email);
    return { 
      success: true, 
      message: 'Bestätigungs-E-Mail wurde gesendet', 
      email 
    };
  } catch (error) {
    console.error('Fehler beim Senden der Bestätigungs-E-Mail:', error);
    return { 
      success: false, 
      message: `Unerwarteter Fehler beim Senden der Bestätigungs-E-Mail: ${(error as Error).message}`, 
      email 
    };
  }
}
