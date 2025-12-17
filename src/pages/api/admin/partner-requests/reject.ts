import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, ContractStatus } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { sendEmail } from '../../../../utils/emailService';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  // Supabase-Client erstellen
  const supabase = createClient({ req, res });
  
  // Authentifizierung prüfen
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }
  
  // Überprüfen, ob der Benutzer ein Admin ist
  if (user.user_metadata?.role !== 'ADMIN') {
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

    if (restaurant.contractStatus !== 'PENDING') {
      return res.status(400).json({ message: 'Restaurant ist nicht im Status PENDING' });
    }

    const { data: { user: authUser }, error: userError } = await supabase.auth.admin.getUserById(restaurant.userId);

    // E-Mail nur senden, wenn der Benutzer gefunden wurde und eine E-Mail-Adresse hat
    if (userError || !authUser || !authUser.email) {
      console.error('Konnte Benutzer nicht für E-Mail-Versand abrufen oder E-Mail fehlt:', userError);
    } else {
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
    }

    // Restaurant-Status auf REJECTED aktualisieren
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
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
