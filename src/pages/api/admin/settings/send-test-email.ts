import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';
import { sendEmail } from '@/utils/email';

interface TestResponse {
  ok: boolean;
  message: string;
  details?: {
    to: string;
    subject: string;
    timestamp: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TestResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    // Admin-Client erstellen und Benutzer authentifizieren
    const adminSupabase = createAdminClient();
    const { data: userData } = await adminSupabase.auth.getUser();
    const user = userData?.user;
    
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Unauthorized' });
    }
    
    const role = (user.user_metadata as any)?.role;
    if (role !== 'admin' && role !== 'ADMIN') {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }

    // E-Mail-Adresse aus der Anfrage oder vom Benutzer verwenden
    const { email } = req.body;
    const recipientEmail = email || user.email;

    if (!recipientEmail) {
      return res.status(400).json({ ok: false, message: 'Keine E-Mail-Adresse angegeben' });
    }

    // Test-E-Mail senden
    const timestamp = new Date().toISOString();
    const success = await sendEmail({
      to: recipientEmail,
      subject: `Contact Tables Test-E-Mail (${timestamp})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Contact Tables E-Mail-Test</h2>
          <p>Hallo ${user.user_metadata.name || 'Admin'},</p>
          <p>Dies ist eine Test-E-Mail, um zu überprüfen, ob Ihr E-Mail-System korrekt konfiguriert ist.</p>
          <p>Wenn Sie diese E-Mail erhalten, funktioniert Ihre SMTP-Konfiguration korrekt!</p>
          <p><strong>Zeitstempel:</strong> ${new Date().toLocaleString()}</p>
          <p>Mit freundlichen Grüßen,<br>Ihr Contact Tables System</p>
        </div>
      `
    });

    if (!success) {
      return res.status(500).json({ ok: false, message: 'E-Mail konnte nicht gesendet werden' });
    }

    return res.status(200).json({
      ok: true,
      message: `Test-E-Mail wurde an ${recipientEmail} gesendet`,
      details: {
        to: recipientEmail,
        subject: `Contact Tables Test-E-Mail (${timestamp})`,
        timestamp
      }
    });
  } catch (err: any) {
    console.error('E-Mail-Test-Fehler:', err);
    return res.status(500).json({ ok: false, message: err?.message || 'E-Mail-Test fehlgeschlagen' });
  }
}
