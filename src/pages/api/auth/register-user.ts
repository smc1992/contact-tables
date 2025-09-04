import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { Database } from '@/types/supabase';
import { createAdminClient } from '@/utils/supabase/server';

// Prisma-Client für Datenbankoperationen
const prisma = new PrismaClient();

// Globale Variable für den Supabase Admin-Client
let supabaseAdmin: ReturnType<typeof createAdminClient> | null = null;

// Initialisiere den Supabase Admin-Client nur einmal
try {
  supabaseAdmin = createAdminClient();
  console.log('Supabase Admin-Client erfolgreich initialisiert');
} catch (error) {
  console.error('Fehler beim Initialisieren des Supabase Admin-Clients:', error);
  // Wir werfen hier keinen Fehler, da wir ihn in der Handler-Funktion abfangen wollen
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Prüfen, ob der Supabase Admin-Client korrekt initialisiert wurde
  if (!supabaseAdmin) {
    console.error('Supabase Admin-Client ist nicht initialisiert');
    return res.status(500).json({ 
      message: 'Interner Serverfehler: Authentifizierungsdienst nicht verfügbar.',
      details: 'Supabase Admin-Client konnte nicht initialisiert werden.'
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  // Alle erwarteten Felder aus dem Request-Body destrukturieren
  const { name, email, password, role, phone, address, postalCode, city, description, cuisine, capacity, openingHours } = req.body;

  // Grundlegende Validierung für Kernfelder
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, E-Mail, Passwort und Rolle sind erforderlich.' });
  }
  
  // Spezifische Validierung für die Rolle 'RESTAURANT'
  if (role === 'RESTAURANT' && (!phone || !address || !postalCode || !city || !description || !cuisine || capacity === undefined || !openingHours)) {
    return res.status(400).json({ message: 'Für die Registrierung eines Restaurants sind alle Felder erforderlich.' });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Das Passwort muss mindestens 8 Zeichen lang sein.' });
  }

  try {
    console.log('Starte Benutzerregistrierung für:', email);
    
    if (!supabaseAdmin) {
      throw new Error('Supabase Admin-Client ist nicht initialisiert');
    }
    
    // Schritt 1: Benutzer in Supabase Auth erstellen
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // E-Mail-Bestätigung erforderlich, damit Supabase Bestätigungs-E-Mails versendet
      user_metadata: {
        name: name,
        role: role,
      },
    });

    if (authError) {
      console.error('Supabase Auth-Fehler bei der Benutzererstellung:', authError);
      console.error('Fehler-Details:', JSON.stringify(authError, null, 2));
      
      if (authError.message.includes('User already registered')) {
        return res.status(409).json({ message: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.' });
      }
      
      // Detailliertere Fehlermeldung zurückgeben
      return res.status(500).json({ 
        message: 'Fehler bei der Benutzererstellung.', 
        error: authError.message,
        details: 'Bitte kontaktieren Sie den Support, falls das Problem weiterhin besteht.'
      });
    }
    
    console.log('Benutzer erfolgreich in Supabase Auth erstellt');

    const user = authData.user;
    if (!user) {
        return res.status(500).json({ message: 'Benutzer konnte nicht erstellt werden.' });
    }
    
    // Explizit eine Bestätigungs-E-Mail senden
    const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (emailError) {
      console.error('Fehler beim Senden der Bestätigungs-E-Mail:', emailError);
      // Wir brechen hier nicht ab, da der Benutzer bereits erstellt wurde
    } else {
      console.log('Bestätigungs-E-Mail erfolgreich gesendet');
    }

    // Transaktion, um sicherzustellen, dass Restaurant und Profil zusammen erstellt werden
    try {
      await prisma.$transaction(async (tx) => {
        // Schritt 2: Ein Profil für jeden Benutzer erstellen
        await tx.profile.create({
          data: {
            id: user.id, // Muss mit der Auth-Benutzer-ID übereinstimmen
            name: name,
            role: role, // Die Rolle aus dem Request explizit setzen
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
              postal_code: postalCode,
              city: city,
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
      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        console.log(`Benutzer ${user.id} wurde nach Datenbank-Transaktionsfehler gelöscht`);
      } else {
        console.error('Konnte Benutzer nicht löschen: Supabase Admin-Client ist nicht initialisiert');
      }
      return res.status(500).json({ 
        message: 'Konnte die erforderlichen Datenbankeinträge nicht erstellen. Der Benutzer wurde zurückgerollt.',
        error: dbError instanceof Error ? dbError.message : 'Unbekannter Datenbankfehler'
      });
    }

    // Wenn wir bis hierher gekommen sind, war die Registrierung erfolgreich
    return res.status(201).json({ 
      message: 'Benutzer erfolgreich registriert. Bitte bestätigen Sie Ihre E-Mail-Adresse.',
      userId: user.id,
      role: role
    });
  } catch (error) {
    console.error('Unerwarteter Fehler bei der Benutzerregistrierung:', error);
    
    // Wenn ein Benutzer erstellt wurde, aber ein Fehler bei der Profilerstellung auftrat,
    // versuchen wir, den Benutzer zu löschen, um Inkonsistenzen zu vermeiden
    if (typeof user !== 'undefined' && user?.id) {
      try {
        if (supabaseAdmin) {
          await supabaseAdmin.auth.admin.deleteUser(user.id);
          console.log(`Benutzer ${user.id} wurde gelöscht, da die Profilerstellung fehlgeschlagen ist.`);
        } else {
          console.error('Konnte Benutzer nicht löschen: Supabase Admin-Client ist nicht initialisiert');
        }
      } catch (deleteError) {
        console.error('Fehler beim Löschen des Benutzers nach fehlgeschlagener Profilerstellung:', deleteError);
      }
    }
    
    return res.status(500).json({ 
      message: 'Ein Fehler ist bei der Registrierung aufgetreten.',
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      details: 'Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.'
    });
  }
}
