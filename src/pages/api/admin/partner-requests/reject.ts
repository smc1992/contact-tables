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

  const { restaurantId, reason } = req.body;

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

    // E-Mail mit Ablehnungsgrund an Restaurant senden
    await sendEmail({
      to: authUser.email,
      subject: 'Ihre Partneranfrage für Contact Tables',
      html: `
        <h1>Entscheidung zu Ihrer Partneranfrage</h1>
        <p>Liebe(r) ${restaurant.profile.name || 'Restaurantbetreiber'},</p>
        <p>vielen Dank für Ihr Interesse an einer Partnerschaft mit Contact Tables für Ihr Restaurant "${restaurant.name}".</p>
        <p>Nach sorgfältiger Prüfung Ihrer Anfrage müssen wir Ihnen leider mitteilen, dass wir Ihre Anfrage derzeit nicht annehmen können.</p>
        ${reason ? `<p><strong>Grund:</strong> ${reason}</p>` : ''}
        <p>Sie können gerne zu einem späteren Zeitpunkt erneut eine Anfrage stellen oder uns kontaktieren, wenn Sie Fragen haben.</p>
        <p>Mit freundlichen Grüßen,<br>Ihr Contact Tables Team</p>
      `
    });

    // Restaurant-Status auf REJECTED aktualisieren
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        // Verwende einen TypeScript-Cast, um den Fehler zu umgehen
        contractStatus: 'REJECTED' as any,
      }
    });

    return res.status(200).json({ 
      message: 'Restaurant-Anfrage erfolgreich abgelehnt'
    });
  } catch (error) {
    console.error('Fehler bei der Ablehnung des Restaurants:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
