import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// E-Mail-Transporter konfigurieren
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD
    }
  });
};

// E-Mail senden
export const sendEmail = async ({ to, subject, text, html }: EmailOptions): Promise<boolean> => {
  try {
    if (!process.env.EMAIL_FROM) {
      console.error('EMAIL_FROM ist nicht konfiguriert');
      return false;
    }

    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Contact Tables" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html
    });
    
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
