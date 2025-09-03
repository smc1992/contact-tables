import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { sendEmail } from '@/utils/email';
import { getSystemSettings } from '@/utils/settings';

interface TestResponse {
  success: boolean;
  message: string;
  details?: {
    to: string;
    timestamp: string;
  };
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TestResponse>) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Client mit Request-Kontext erstellen für die Authentifizierung
    const supabase = createClient({ req, res });
    
    // Benutzer authentifizieren mit dem Client, der Cookies verarbeiten kann
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Admin-Client für privilegierte Operationen erstellen
    const adminClient = createAdminClient();
    
    if (authError || !user) {
      return res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
    }
    
    // Benutzerrolle überprüfen
    const role = user.user_metadata.role;
    if (role !== 'admin' && role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Keine Berechtigung' });
    }
    
    // E-Mail-Adresse aus der Anfrage oder vom Benutzer verwenden
    const { email } = req.body || {};
    const recipientEmail = email || user.email;

    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'Keine E-Mail-Adresse verfügbar' });
    }
    
    // Zeitstempel für die E-Mail
    const timestamp = new Date().toISOString();
    const formattedTime = new Date().toLocaleString('de-DE');
    
    // System-Einstellungen für die E-Mail-Signatur abrufen
    const settings = await getSystemSettings();
    
    // Test-E-Mail senden
    const success = await sendEmail({
      to: recipientEmail,
      subject: `Contact Tables Test-E-Mail (${formattedTime})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Contact Tables E-Mail-Test</h2>
          <p>Hallo ${user.user_metadata.name || 'Admin'},</p>
          <p>Dies ist eine Test-E-Mail, um zu überprüfen, ob Ihr E-Mail-System korrekt konfiguriert ist.</p>
          <p>Wenn Sie diese E-Mail erhalten, funktioniert Ihre SMTP-Konfiguration korrekt!</p>
          <p><strong>Zeitstempel:</strong> ${formattedTime}</p>
          <p>Mit freundlichen Grüßen,<br>Ihr Contact Tables System</p>
          <!-- Die Signatur wird automatisch durch die sendEmail-Funktion hinzugefügt -->
        </div>
      `
    });
    
    if (!success) {
      return res.status(500).json({ success: false, message: 'E-Mail konnte nicht gesendet werden' });
    }
    
    return res.status(200).json({
      success: true,
      message: `Test-E-Mail wurde an ${recipientEmail} gesendet`,
      details: {
        to: recipientEmail,
        timestamp
      }
    });
  } catch (error: any) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Serverfehler',
      error: error?.message || 'Unbekannter Fehler'
    });
  }
}
