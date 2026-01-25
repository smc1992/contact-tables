import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message, type = 'general' } = req.body;

    // Validierung
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Alle Felder sind erforderlich' });
    }

    // Typ-Label Mapping
    const typeLabels: Record<string, string> = {
      'general': 'Allgemeine Anfrage',
      'restaurant': 'Restaurant-Partnerschaft',
      'support': 'Technischer Support',
      'feedback': 'Feedback'
    };

    const typeLabel = typeLabels[type] || 'Allgemeine Anfrage';

    // E-Mail-Format validieren
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Ungültige E-Mail-Adresse' });
    }

    // Nachricht in der Datenbank speichern
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        createdAt: new Date()
      }
    });

    // E-Mail senden (in der Produktion)
    if (process.env.NODE_ENV === 'production') {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT),
          secure: Number(process.env.EMAIL_SERVER_PORT) === 465, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD
          }
        });

        await transporter.sendMail({
          from: `"Contact Tables" <${process.env.EMAIL_FROM}>`,
          to: process.env.CONTACT_EMAIL || 'info@contact-tables.org',
          subject: `[${typeLabel}] ${subject}`,
          text: `Typ: ${typeLabel}\nName: ${name}\nE-Mail: ${email}\nNachricht: ${message}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4f46e5;">Neue Kontaktanfrage: ${typeLabel}</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>E-Mail:</strong> ${email}</p>
              <p><strong>Betreff:</strong> ${subject}</p>
              <p><strong>Anfrage-Typ:</strong> ${typeLabel}</p>
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
      } catch (emailError) {
        console.error('Fehler beim Senden der E-Mail:', emailError);
        // Wir geben keinen Fehler zurück, da die Nachricht bereits in der Datenbank gespeichert wurde
      }
    }

    return res.status(200).json({ message: 'Nachricht erfolgreich gesendet' });
  } catch (error) {
    console.error('Fehler bei der Kontaktanfrage:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
