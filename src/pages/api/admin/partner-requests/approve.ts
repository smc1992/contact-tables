import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, ContractStatus } from '@prisma/client';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { sendEmail } from '../../../../utils/emailService';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  // Supabase-Client erstellen
  const supabase = createPagesServerClient({ req, res });
  
  // Authentifizierung prüfen
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }
  
  // Benutzer aus der Datenbank abrufen, um die Rolle zu überprüfen
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });
  
  // Überprüfen, ob der Benutzer ein Admin ist
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Keine Berechtigung' });
  }

  const { restaurantId } = req.body;

  if (!restaurantId) {
    return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
  }

  try {
    // Restaurant in der Datenbank finden und das zugehörige Profil laden
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        profile: true,
      }
    });

    if (!restaurant || !restaurant.profile) {
      return res.status(404).json({ message: 'Restaurant oder zugehöriges Profil nicht gefunden' });
    }

    // Benutzer aus der auth.users-Tabelle abrufen, um die E-Mail zu erhalten
    const authUser = await prisma.users.findUnique({
      where: { id: restaurant.userId },
      select: { email: true },
    });

    if (!authUser || !authUser.email) {
      return res.status(400).json({ message: 'Keine E-Mail-Adresse für das Restaurant vorhanden' });
    }

    if (restaurant.contractStatus !== 'PENDING') {
      return res.status(400).json({ message: 'Restaurant ist nicht im Status PENDING' });
    }

    // Zahlungslink generieren (in einer echten Anwendung würde hier Stripe oder ein anderer Zahlungsanbieter verwendet)
    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/restaurant/payment/${restaurantId}`;

    // E-Mail mit Zahlungslink an Restaurant senden
    await sendEmail({
      to: authUser.email,
      subject: 'Ihre Partneranfrage wurde genehmigt - Nächste Schritte',
      html: `
        <h1>Herzlichen Glückwunsch!</h1>
        <p>Liebe(r) ${restaurant.profile.name || 'Restaurantbetreiber'},</p>
        <p>wir freuen uns, Ihnen mitteilen zu können, dass Ihre Anfrage für das Restaurant "${restaurant.name}" genehmigt wurde!</p>
        <p>Um den Prozess abzuschließen und Ihr Restaurant auf Contact Tables zu aktivieren, folgen Sie bitte diesen Schritten:</p>
        <ol>
          <li>Klicken Sie auf den folgenden Link, um Ihre Zahlungsinformationen einzugeben und Ihren Vertrag zu bestätigen: <a href="${paymentLink}">Zahlungsinformationen eingeben</a></li>
          <li>Nach erfolgreicher Bestätigung wird Ihr Restaurant auf unserer Plattform sichtbar.</li>
        </ol>
        <p>Vielen Dank, dass Sie Teil von Contact Tables sind!</p>
        <p>Mit freundlichen Grüßen,<br>Ihr Contact Tables Team</p>
      `
    });

    // Restaurant-Status auf APPROVED aktualisieren (noch nicht ACTIVE, da Zahlung und Vertrag noch ausstehen)
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        contractStatus: 'APPROVED' as any, // TypeScript-Cast, um Typfehler zu vermeiden
      }
    });

    return res.status(200).json({ 
      message: 'Restaurant erfolgreich genehmigt und Zahlungslink gesendet',
      paymentLink
    });
  } catch (error) {
    console.error('Fehler bei der Genehmigung des Restaurants:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
