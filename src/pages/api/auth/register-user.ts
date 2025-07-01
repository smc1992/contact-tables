import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { Database } from '@/types/supabase';

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('FATAL: Supabase URL or Service Role Key is not set in environment variables.');
  // Im produktiven Betrieb könnte man hier den Prozess beenden
  // process.exit(1);
}

// Initialisiert den Supabase-Client mit Admin-Rechten (Service Role Key)
const supabaseAdmin = createClient<Database>(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  // Alle erwarteten Felder aus dem Request-Body destrukturieren
  const { name, email, password, role, phone, address, description, cuisine, capacity, openingHours } = req.body;

  // Grundlegende Validierung für Kernfelder
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, E-Mail, Passwort und Rolle sind erforderlich.' });
  }
  
  // Spezifische Validierung für die Rolle 'RESTAURANT'
  if (role === 'RESTAURANT' && (!phone || !address || !description || !cuisine || capacity === undefined || !openingHours)) {
    return res.status(400).json({ message: 'Für die Registrierung eines Restaurants sind alle Felder erforderlich.' });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Das Passwort muss mindestens 8 Zeichen lang sein.' });
  }

  try {
    // Schritt 1: Benutzer in Supabase Auth erstellen
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Benutzer automatisch bestätigen, da dies serverseitig geschieht
      user_metadata: {
        name: name,
        role: role,
      },
    });

    if (authError) {
      console.error('Supabase Auth-Fehler bei der Benutzererstellung:', authError);
      if (authError.message.includes('User already registered')) {
        return res.status(409).json({ message: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.' });
      }
      return res.status(500).json({ message: 'Fehler bei der Benutzererstellung.', error: authError.message });
    }

    const user = authData.user;
    if (!user) {
        return res.status(500).json({ message: 'Benutzer konnte nicht erstellt werden.' });
    }

    // Transaktion, um sicherzustellen, dass Restaurant und Profil zusammen erstellt werden
    try {
      await prisma.$transaction(async (tx) => {
        // Schritt 2: Ein Profil für jeden Benutzer erstellen
        await tx.profile.create({
          data: {
            id: user.id, // Muss mit der Auth-Benutzer-ID übereinstimmen
            name: name,
          }
        });

        // Schritt 3: Wenn die Rolle 'RESTAURANT' ist, ein Restaurant-Profil erstellen
        if (role === 'RESTAURANT') {
          await tx.restaurant.create({
            data: {
              userId: user.id,
              name: name, // Den tatsächlichen Restaurantnamen aus dem Formular verwenden
              email: user.email,
              phone: phone,
              address: address,
              description: description,
              cuisine: cuisine,
              capacity: capacity,
              openingHours: openingHours,
              isActive: false, // Restaurants starten als inaktiv
              contractStatus: 'PENDING', // Startet im ausstehenden Status
            },
          });
        }
      });
    } catch (dbError) {
      console.error('Datenbank-Transaktionsfehler:', dbError);
      // Wenn die Datenbanktransaktion fehlschlägt, den erstellten Auth-Benutzer löschen, um verwaiste Benutzer zu vermeiden.
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      return res.status(500).json({ message: 'Konnte die erforderlichen Datenbankeinträge nicht erstellen. Der Benutzer wurde zurückgerollt.' });
    }

    return res.status(201).json({ message: 'Benutzer erfolgreich erstellt.', userId: user.id });

  } catch (error) {
    console.error('Allgemeiner Registrierungsfehler:', error);
    return res.status(500).json({ message: 'Interner Serverfehler bei der Registrierung.' });
  }
}
