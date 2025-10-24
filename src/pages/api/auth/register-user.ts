import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { Database } from '@/types/supabase';
import { createAdminClient } from '@/utils/supabase/server';

// Prisma-Client für Datenbankoperationen
const prisma = new PrismaClient();

// In Netlify-Serverless-Funktionen sollten wir den Client bei jeder Anfrage neu erstellen
// anstatt eine globale Variable zu verwenden, da jede Funktion in einer isolierten Umgebung läuft
let supabaseAdmin: ReturnType<typeof createAdminClient> | null = null;

// Prüfe, ob wir in einer Netlify-Umgebung sind
const isNetlify = process.env.NETLIFY === 'true';

// Prüfe, ob die erforderlichen Umgebungsvariablen vorhanden sind
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Detaillierte Protokollierung der Umgebungsvariablen (ohne sensible Werte)
console.log(`Registrierung API (${isNetlify ? 'Netlify' : 'Lokal'}): Umgebungsvariablen Status:`, {
  NETLIFY: process.env.NETLIFY,
  NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
  NEXT_PUBLIC_SUPABASE_URL_LENGTH: supabaseUrl?.length || 0,
  SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
  SUPABASE_SERVICE_ROLE_KEY_LENGTH: supabaseServiceKey?.length || 0,
  NODE_ENV: process.env.NODE_ENV,
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
});

// In Netlify-Umgebung initialisieren wir den Client nicht global,
// sondern erst bei Bedarf in der Handler-Funktion
if (!isNetlify) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Erforderliche Umgebungsvariablen fehlen: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY');
    }
    
    supabaseAdmin = createAdminClient();
    console.log('Lokale Umgebung: Supabase Admin-Client erfolgreich initialisiert');
  } catch (error) {
    console.error('Fehler beim Initialisieren des Supabase Admin-Clients:', error);
    // Wir werfen hier keinen Fehler, da wir ihn in der Handler-Funktion abfangen wollen
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Benutzer-Variable für den Scope der gesamten Funktion deklarieren
  let user: any = null;
  // Prüfen, ob die erforderlichen Umgebungsvariablen vorhanden sind
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Erforderliche Umgebungsvariablen fehlen');
    return res.status(500).json({ 
      message: 'Interner Serverfehler: Konfigurationsproblem.',
      details: 'Die Anwendung ist nicht korrekt konfiguriert. Bitte kontaktieren Sie den Administrator.'
    });
  }

  // In Netlify-Umgebung müssen wir den Client bei jeder Anfrage neu erstellen
  if (isNetlify || !supabaseAdmin) {
    console.log(`${isNetlify ? 'Netlify-Umgebung' : 'Lokale Umgebung'}: Initialisiere Supabase Admin-Client`);
    try {
      // Direkte Zuweisung der Umgebungsvariablen für bessere Kompatibilität mit Netlify
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!url || !key) {
        throw new Error('Umgebungsvariablen fehlen beim Versuch, den Admin-Client zu initialisieren');
      }
      
      // Protokolliere die Länge der Werte (nicht die Werte selbst)
      console.log('URL Länge:', url.length, 'Key Länge:', key.length);
      
      supabaseAdmin = createAdminClient();
      console.log(`${isNetlify ? 'Netlify' : 'Lokal'}: Supabase Admin-Client erfolgreich initialisiert`);
    } catch (initError) {
      console.error(`${isNetlify ? 'Netlify' : 'Lokal'}: Initialisierung des Supabase Admin-Clients fehlgeschlagen:`, initError);
      
      // Detailliertere Fehlermeldung für Netlify
      if (isNetlify) {
        return res.status(500).json({ 
          message: 'Netlify: Authentifizierungsdienst nicht verfügbar.',
          details: 'Bitte überprüfen Sie die Netlify-Umgebungsvariablen und stellen Sie sicher, dass SUPABASE_SERVICE_ROLE_KEY korrekt gesetzt ist.'
        });
      } else {
        return res.status(500).json({ 
          message: 'Interner Serverfehler: Authentifizierungsdienst nicht verfügbar.',
          details: 'Supabase Admin-Client konnte nicht initialisiert werden.'
        });
      }
    }
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
      email_confirm: true, // E-Mail direkt bestätigen, da wir die Bestätigungs-E-Mail manuell senden
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

    user = authData.user;
    if (!user) {
        return res.status(500).json({ message: 'Benutzer konnte nicht erstellt werden.' });
    }
    
    // Explizit eine Bestätigungs-E-Mail senden
    console.log('Sende Bestätigungs-E-Mail an:', email);
    console.log('Redirect-URL:', `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`);
    
    // Prüfe, ob die SITE_URL korrekt gesetzt ist
    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      console.error('WARNUNG: NEXT_PUBLIC_SITE_URL ist nicht gesetzt!');
    }
    
    try {
      const { data: linkData, error: emailError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink', // Verwende magiclink statt signup, da der Benutzer bereits bestätigt ist
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm?next=/restaurant/dashboard`,
        },
      });

      if (emailError) {
        console.error('Fehler beim Senden der Bestätigungs-E-Mail:', emailError);
        console.error('Fehler-Details:', JSON.stringify(emailError, null, 2));
        // Wir brechen hier nicht ab, da der Benutzer bereits erstellt wurde
      } else {
        console.log('Bestätigungs-E-Mail erfolgreich gesendet');
        if (linkData) {
          console.log('E-Mail-Link generiert:', !!linkData);
        }
      }
    } catch (emailSendError) {
      console.error('Unerwarteter Fehler beim E-Mail-Versand:', emailSendError);
      // Wir brechen hier nicht ab, da der Benutzer bereits erstellt wurde
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
              isVisible: false,
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
    
    // Detaillierte Fehlerprotokollierung für bessere Diagnose
    try {
      console.error('Fehler-Typ:', error?.constructor?.name);
      console.error('Fehler-Stack:', error instanceof Error ? error.stack : 'Kein Stack verfügbar');
      
      // Prüfe auf spezifische Fehlertypen
      if (error instanceof TypeError && error.message.includes('is not a function')) {
        console.error('Möglicher API-Kompatibilitätsfehler mit Supabase');
      }
      
      if (error instanceof Error && error.message.includes('rate limit')) {
        console.error('Rate-Limiting-Fehler erkannt');
        return res.status(429).json({
          message: 'Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut.',
          error: 'rate_limited',
          details: 'Die Anwendung hat das Anfragelimit erreicht.'
        });
      }
    } catch (logError) {
      console.error('Fehler beim Protokollieren des ursprünglichen Fehlers:', logError);
    }
    
    // Wenn ein Benutzer erstellt wurde, aber ein Fehler bei der Profilerstellung auftrat,
    // versuchen wir, den Benutzer zu löschen, um Inkonsistenzen zu vermeiden
    // Prüfen, ob die user-Variable im äußeren Scope existiert und eine ID hat
    if (typeof user === 'object' && user !== null && 'id' in user) {
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
    
    // Benutzerfreundliche Fehlermeldung zurückgeben
    return res.status(500).json({ 
      message: 'Ein Fehler ist bei der Registrierung aufgetreten.',
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      details: 'Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.'
    });
  }
}
