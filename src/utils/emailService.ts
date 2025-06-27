// E-Mail-Service für Contact Tables
// In einer Produktionsumgebung würde hier ein echter E-Mail-Dienst wie SendGrid, Mailgun oder Amazon SES verwendet werden

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Sendet eine E-Mail an den angegebenen Empfänger
 * In einer Produktionsumgebung würde diese Funktion einen echten E-Mail-Dienst verwenden
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, from = 'noreply@contact-tables.de' } = options;
  
  // In einer Entwicklungsumgebung nur in die Konsole loggen
  if (process.env.NODE_ENV === 'development') {
    console.log('----------------------------------');
    console.log('E-Mail würde gesendet werden:');
    console.log(`Von: ${from}`);
    console.log(`An: ${to}`);
    console.log(`Betreff: ${subject}`);
    console.log('Inhalt:');
    console.log(html);
    console.log('----------------------------------');
    return true;
  }
  
  try {
    // In einer Produktionsumgebung würde hier der tatsächliche E-Mail-Versand implementiert werden
    // Beispiel für SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to,
      from,
      subject,
      html,
    };
    
    await sgMail.send(msg);
    */
    
    // Simuliere erfolgreichen E-Mail-Versand
    return true;
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    return false;
  }
}
