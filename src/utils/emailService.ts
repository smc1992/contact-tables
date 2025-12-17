import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Konfiguriere den E-Mail-Transporter einmalig
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: Number(process.env.EMAIL_SERVER_PORT) === 465, // true für Port 465 (SSL), sonst false
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

/**
 * Sendet eine E-Mail unter Verwendung des konfigurierten Transporters.
 * Im Entwicklungsmodus werden E-Mails in der Konsole ausgegeben, anstatt sie zu senden.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html } = options;
  const from = `contact-tables <${process.env.EMAIL_FROM}>`;

  // Im Entwicklungsmodus nur in die Konsole loggen
  if (process.env.NODE_ENV === 'development') {
    console.log('----------------------------------');
    console.log('E-Mail würde gesendet werden:');
    console.log(`Von: ${from}`);
    console.log(`An: ${to}`);
    console.log(`Betreff: ${subject}`);
    console.log('----------------------------------');
    return true;
  }

  // Im Produktionsmodus die E-Mail tatsächlich senden
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`E-Mail erfolgreich an ${to} gesendet.`);
    return true;
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    return false;
  }
}
