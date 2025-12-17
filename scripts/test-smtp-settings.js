// Test-Skript für SMTP-Einstellungen und E-Mail-Versand
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Erstelle einen Supabase-Client mit dem Service Role Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Umgebungsvariablen fehlen: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testSmtpSettings() {
  console.log('=== Test der SMTP-Einstellungen ===');
  
  try {
    // Hole die Systemeinstellungen
    const { data: settings, error } = await adminClient
      .from('system_settings')
      .select('*')
      .single();
    
    if (error) {
      console.error('Fehler beim Abrufen der Systemeinstellungen:', error);
      return;
    }
    
    console.log('Systemeinstellungen erfolgreich abgerufen:', settings.id);
    
    // SMTP-Einstellungen aus der Datenbank oder Umgebungsvariablen verwenden
    const host = settings?.smtp_host || process.env.EMAIL_SERVER_HOST;
    const port = Number(settings?.smtp_port || process.env.EMAIL_SERVER_PORT);
    const user = settings?.smtp_user || process.env.EMAIL_SERVER_USER;
    const pass = settings?.smtp_password || process.env.EMAIL_SERVER_PASSWORD;
    const fromEmail = settings?.contact_email || process.env.EMAIL_FROM;
    
    console.log('SMTP-Konfiguration:', {
      host,
      port,
      secure: port === 465,
      user,
      pass: pass ? '********' : undefined,
      fromEmail
    });
    
    if (!host || !port || !user || !pass || !fromEmail) {
      console.error('SMTP-Konfiguration unvollständig. Bitte überprüfen Sie die Einstellungen.');
      return;
    }
    
    // Erstelle einen Nodemailer-Transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
    
    console.log('Nodemailer-Transporter erstellt. Überprüfe Verbindung...');
    
    // Überprüfe die Verbindung
    const verifyResult = await transporter.verify();
    console.log('Verbindungstest erfolgreich:', verifyResult);
    
    // Sende eine Test-E-Mail
    console.log('Sende Test-E-Mail...');
    
    const mailOptions = {
      from: `"Contact Tables Test" <${fromEmail}>`,
      to: fromEmail, // Sende an die gleiche E-Mail-Adresse
      subject: 'SMTP-Test von Contact Tables',
      text: 'Dies ist eine Test-E-Mail, um die SMTP-Konfiguration zu überprüfen.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">SMTP-Test erfolgreich</h2>
          <p>Diese E-Mail bestätigt, dass Ihre SMTP-Konfiguration korrekt ist.</p>
          <p><strong>Konfiguration:</strong></p>
          <ul>
            <li>Host: ${host}</li>
            <li>Port: ${port}</li>
            <li>Benutzer: ${user}</li>
            <li>Absender: ${fromEmail}</li>
          </ul>
          <p>Mit freundlichen Grüßen,<br>Ihr Contact Tables System</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('E-Mail erfolgreich gesendet:', info.messageId);
    
  } catch (error) {
    console.error('Fehler beim Testen der SMTP-Einstellungen:', error);
  }
}

testSmtpSettings();
