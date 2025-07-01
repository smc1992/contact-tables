import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, ContractStatus } from '@prisma/client'; 
import { createClient } from '@supabase/supabase-js'; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL oder Service Role Key ist nicht definiert. Bitte überprüfen Sie Ihre Umgebungsvariablen.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const { restaurantId, token } = req.body;

  // Validierung der Eingabedaten
  if (!restaurantId || !token) {
    return res.status(400).json({ message: 'Fehlende erforderliche Felder' });
  }

  try {
    // Token validieren (in einer realen Anwendung würde hier eine richtige Token-Validierung stattfinden)
    // Für dieses Beispiel nehmen wir an, dass das Token gültig ist, wenn es vorhanden ist

    const prisma = new PrismaClient();

    // Restaurant finden
    // Restaurant finden, inklusive zugehörigem Benutzerprofil (für Supabase auth ID)
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
      include: { // Hinzufügen, um die Benutzer-ID für Supabase zu erhalten
        profile: true, // Relation 'profile' zu 'Profile' Tabelle, wo 'Profile.id' die Supabase auth.users.id ist
      }
    });

    if (!restaurant) {
      await prisma.$disconnect();
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    // Überprüfen, ob der Vertragsstatus "APPROVED" ist
    if (restaurant.contractStatus !== ('APPROVED' as ContractStatus)) { // Typ-Assertion hinzugefügt
      await prisma.$disconnect();
      return res.status(400).json({ message: 'Vertrag ist nicht zur Annahme bereit' });
    }

    // Vertrag akzeptieren und Restaurant aktivieren
    const updatedRestaurant = await prisma.restaurant.update({
      where: {
        id: restaurantId,
      },
      data: {
        contractStatus: ContractStatus.ACTIVE,
        isActive: true,
        contractAcceptedAt: new Date(),
      },
    });

    // Supabase Benutzerrolle aktualisieren
    // Annahme: restaurant.user.id ist die Supabase auth.users.id
    // oder restaurant.userId, falls es eine direkte Spalte ist.
    // Wir verwenden restaurant.user.id basierend auf der Annahme der 'user' Relation.
    const supabaseAuthUserId = restaurant.profile?.id;
    const restaurantEmail = restaurant.email; // Für Logging, falls ID fehlt

    if (supabaseAuthUserId) {
      try {
        const { data: adminUserResponse, error: adminUserError } = await supabaseAdmin.auth.admin.updateUserById(
          supabaseAuthUserId,
          { user_metadata: { role: 'RESTAURANT' } }
        );

        if (adminUserError) {
          console.error(`Fehler beim Aktualisieren der Supabase Benutzerrolle für Restaurant ${restaurantId} (Benutzer-ID ${supabaseAuthUserId}):`, adminUserError);
        } else {
          console.log(`Supabase Benutzerrolle für Benutzer-ID ${supabaseAuthUserId} erfolgreich auf RESTAURANT gesetzt.`);
        }
      } catch (e) {
        console.error(`Unerwarteter Fehler beim Aktualisieren der Supabase Benutzerrolle für Benutzer-ID ${supabaseAuthUserId}:`, e);
      }
    } else {
      console.warn(`Keine Supabase Benutzer-ID für Restaurant ${restaurantId} (E-Mail: ${restaurantEmail}) gefunden. Rolle konnte nicht automatisch aktualisiert werden.`);
    }

    await prisma.$disconnect();

    // Erfolgreiche Antwort senden
    return res.status(200).json({
      success: true,
      message: 'Vertrag erfolgreich akzeptiert. Restaurantstatus aktualisiert. Benutzerrolle wird aktualisiert, falls Benutzer-ID vorhanden.',
      restaurant: {
        id: updatedRestaurant.id,
        name: updatedRestaurant.name,
        contractStatus: updatedRestaurant.contractStatus,
      },
    });
  } catch (error: any) {
    console.error('Fehler bei der Vertragsannahme:', error);
    return res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
}
