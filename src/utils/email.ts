import nodemailer from 'nodemailer';
import { getSystemSettings } from './settings';
import { v4 as uuidv4 } from 'uuid';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// E-Mail-Transporter konfigurieren
const createTransporter = async () => {
  // Systemeinstellungen abrufen
  const settings = await getSystemSettings();
  
  // SMTP-Einstellungen aus der Datenbank oder Umgebungsvariablen verwenden
  const host = settings?.smtp_host || process.env.EMAIL_SERVER_HOST;
  const port = Number(settings?.smtp_port || process.env.EMAIL_SERVER_PORT);
  const user = settings?.smtp_user || process.env.EMAIL_SERVER_USER;
  const pass = settings?.smtp_password || process.env.EMAIL_SERVER_PASSWORD;
  
  // Absender-E-Mail aus Einstellungen oder Umgebungsvariablen verwenden
  const fromEmail = settings?.contact_email || process.env.EMAIL_FROM;
  const domain = fromEmail?.split('@')[1];
  
  console.log('SMTP-Konfiguration:', { host, port, secure: port === 465 });
  
  // Basis-Transporter-Konfiguration
  const transporterConfig: any = {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  };
  
  // DKIM-Konfiguration hinzufügen, wenn alle erforderlichen Einstellungen vorhanden sind
  if (settings?.dkim_private_key && settings?.dkim_selector && domain) {
    try {
      console.log(`DKIM-Konfiguration wird mit Selector ${settings.dkim_selector} für Domain ${domain} hinzugefügt`);
      
      transporterConfig.dkim = {
        domainName: domain,
        keySelector: settings.dkim_selector,
        privateKey: settings.dkim_private_key
      };
      
      console.log('DKIM-Konfiguration erfolgreich hinzugefügt');
    } catch (dkimError) {
      console.error('Fehler bei der DKIM-Konfiguration:', dkimError);
      // Fehler bei der DKIM-Konfiguration sollte den E-Mail-Versand nicht blockieren
    }
  }
  
  return nodemailer.createTransport(transporterConfig);
};

// E-Mail senden
export const sendEmail = async ({ to, subject, text, html }: EmailOptions): Promise<boolean> => {
  try {
    // Systemeinstellungen abrufen
    const settings = await getSystemSettings();
    
    if (!process.env.EMAIL_FROM && !settings?.contact_email) {
      console.error('EMAIL_FROM ist nicht konfiguriert und keine Kontakt-E-Mail in den Einstellungen');
      return false;
    }

    const transporter = await createTransporter();
    
    // HTML mit Signatur vorbereiten
    let finalHtml = html;
    
    // Wenn eine Signatur vorhanden ist und HTML-Inhalt existiert, füge die Signatur hinzu
    if (settings?.email_signature && html) {
      // Prüfen, ob HTML einen schließenden Body-Tag hat
      if (html.includes('</body>')) {
        // Füge die Signatur vor dem schließenden Body-Tag ein
        finalHtml = html.replace('</body>', `
<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
  ${settings.email_signature}
</div>
</body>`);
      } else {
        // Füge die Signatur am Ende des HTML-Inhalts ein
        finalHtml = `${html}
<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
  ${settings.email_signature}
</div>`;
      }
    }
    
    // Wenn eine Signatur vorhanden ist und nur Text-Inhalt existiert, füge die Signatur zum Text hinzu
    let finalText = text;
    if (settings?.email_signature && text && !html) {
      // Entferne HTML-Tags aus der Signatur für die Textversion
      const plainSignature = settings.email_signature.replace(/<[^>]*>/g, '');
      finalText = `${text}\n\n---\n${plainSignature}`;
    }
    
    // Absender-E-Mail aus Einstellungen oder Umgebungsvariablen verwenden
    const fromEmail = settings?.contact_email || process.env.EMAIL_FROM;
    const domain = fromEmail?.split('@')[1];
    
    // Generiere eine eindeutige Message-ID
    const messageId = `<${uuidv4()}@${domain}>`;
    
    // Erstelle erweiterte E-Mail-Header für bessere Zustellbarkeit
    const headers: Record<string, string> = {
      'Message-ID': messageId,
      'X-Mailer': 'Contact Tables Email Service',
      'X-Contact-Tables-Version': '1.0.0',
      'List-Unsubscribe': `<mailto:unsubscribe@${domain}?subject=unsubscribe>`,
      'Precedence': 'bulk'
    };
    
    // Wenn Bounce-Handling aktiviert ist, füge Return-Path hinzu
    if (settings?.bounce_handling_email) {
      headers['Return-Path'] = `<${settings.bounce_handling_email}>`;
    }
    
    // E-Mail-Optionen mit erweiterten Headern
    const mailOptions = {
      from: `"Contact Tables" <${fromEmail}>`,
      to,
      subject,
      text: finalText,
      html: finalHtml,
      headers,
      messageId
    };
    
    // DKIM wird jetzt direkt über die Nodemailer-Konfiguration im Transporter hinzugefügt
    // Wir fügen hier einen Hinweis hinzu, dass DKIM aktiviert ist, wenn die Konfiguration vorhanden ist
    if (settings?.dkim_private_key && settings?.dkim_selector && domain) {
      headers['X-DKIM-Enabled'] = 'true';
      console.log(`E-Mail wird mit DKIM für Domain ${domain} und Selector ${settings.dkim_selector} gesendet`);
    }
    
    // E-Mail senden
    await transporter.sendMail(mailOptions);
    
    return true;
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    return false;
  }
};

// Kontaktformular-E-Mail an Admin senden
export const sendContactFormEmail = async (data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<boolean> => {
  const { name, email, subject, message } = data;
  
  const adminEmail = process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error('CONTACT_EMAIL oder ADMIN_EMAIL ist nicht konfiguriert');
    return false;
  }
  
  return sendEmail({
    to: adminEmail,
    subject: `Neue Kontaktanfrage: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Neue Kontaktanfrage über Contact Tables</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>E-Mail:</strong> ${email}</p>
        <p><strong>Betreff:</strong> ${subject}</p>
        <p><strong>Nachricht:</strong></p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
          Diese Nachricht wurde über das Kontaktformular auf contact-tables.de gesendet.
        </p>
      </div>
    `
  });
};

// Bestätigungs-E-Mail an Benutzer senden
export const sendContactConfirmationEmail = async (data: {
  name: string;
  email: string;
  subject: string;
}): Promise<boolean> => {
  const { name, email, subject } = data;
  
  return sendEmail({
    to: email,
    subject: `Bestätigung Ihrer Kontaktanfrage: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Vielen Dank für Ihre Kontaktanfrage</h2>
        <p>Hallo ${name},</p>
        <p>wir haben Ihre Kontaktanfrage mit dem Betreff "${subject}" erhalten.</p>
        <p>Unser Team wird sich so schnell wie möglich bei Ihnen melden.</p>
        <p>Mit freundlichen Grüßen,<br>Ihr Contact Tables Team</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht auf diese Nachricht.
          </p>
        </div>
      </div>
    `
  });
};

// Neue Kontakttisch-Anfrage E-Mail an Restaurant senden
export const sendNewContactTableRequestToRestaurant = async (data: {
  restaurantEmail: string;
  restaurantName: string;
  customerName: string;
  date: string;
  time: string;
  partySize: number;
  message?: string;
}): Promise<boolean> => {
  const { restaurantEmail, restaurantName, customerName, date, time, partySize, message } = data;
  
  return sendEmail({
    to: restaurantEmail,
    subject: `Neue Kontakttisch-Anfrage für ${date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Neue Kontakttisch-Anfrage</h2>
        <p>Hallo ${restaurantName},</p>
        <p>Sie haben eine neue Kontakttisch-Anfrage erhalten:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Kunde:</strong> ${customerName}</p>
          <p><strong>Datum:</strong> ${date}</p>
          <p><strong>Uhrzeit:</strong> ${time}</p>
          <p><strong>Anzahl der Personen:</strong> ${partySize}</p>
          ${message ? `<p><strong>Nachricht:</strong> ${message}</p>` : ''}
        </div>
        <p>Bitte loggen Sie sich in Ihr Restaurant-Dashboard ein, um diese Anfrage zu bearbeiten.</p>
        <p>Mit freundlichen Grüßen,<br>Ihr Contact Tables Team</p>
      </div>
    `
  });
};

// Bestätigungs-E-Mail für Kontakttisch-Anfrage an Kunde senden
export const sendContactTableConfirmationToCustomer = async (data: {
  customerEmail: string;
  customerName: string;
  restaurantName: string;
  date: string;
  time: string;
  partySize: number;
}): Promise<boolean> => {
  const { customerEmail, customerName, restaurantName, date, time, partySize } = data;
  
  return sendEmail({
    to: customerEmail,
    subject: `Bestätigung Ihrer Kontakttisch-Anfrage bei ${restaurantName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Ihre Kontakttisch-Anfrage wurde gesendet</h2>
        <p>Hallo ${customerName},</p>
        <p>vielen Dank für Ihre Kontakttisch-Anfrage bei ${restaurantName}.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Restaurant:</strong> ${restaurantName}</p>
          <p><strong>Datum:</strong> ${date}</p>
          <p><strong>Uhrzeit:</strong> ${time}</p>
          <p><strong>Anzahl der Personen:</strong> ${partySize}</p>
        </div>
        <p>Das Restaurant wird Ihre Anfrage prüfen und sich bei Ihnen melden.</p>
        <p>Sie können den Status Ihrer Anfrage jederzeit in Ihrem Benutzerkonto einsehen.</p>
        <p>Mit freundlichen Grüßen,<br>Ihr Contact Tables Team</p>
      </div>
    `
  });
};
