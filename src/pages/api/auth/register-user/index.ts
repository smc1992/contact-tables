import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { Database } from '@/types/supabase';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { sendConfirmationEmail } from '@/utils/email/sendConfirmationEmail';

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

// Rate-Limiting-Konfiguration
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 Stunde in Millisekunden
const MAX_REQUESTS_PER_IP = 5; // Maximale Anzahl von Registrierungen pro IP-Adresse pro Stunde

// Retry-Konfiguration für Supabase API-Aufrufe
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 Sekunde Basisverzögerung

// In-Memory-Cache für Rate-Limiting (wird bei Serverneustarts zurückgesetzt)
const rateLimitCache: Record<string, { count: number, timestamp: number }> = {};

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

// Typsichere Funktion zum Überprüfen, ob der Admin-Client initialisiert ist
function ensureAdminClient(): ReturnType<typeof createAdminClient> {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin-Client ist nicht initialisiert');
  }
  return supabaseAdmin;
}

// Hilfsfunktion zur Überprüfung des Rate-Limits
function checkRateLimit(ip: string): { allowed: boolean, retryAfter?: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Alte Einträge bereinigen
  Object.keys(rateLimitCache).forEach(key => {
    if (rateLimitCache[key].timestamp < windowStart) {
      delete rateLimitCache[key];
    }
  });
  
  // Aktuellen IP-Eintrag prüfen oder erstellen
  if (!rateLimitCache[ip]) {
    rateLimitCache[ip] = { count: 0, timestamp: now };
  } else if (rateLimitCache[ip].timestamp < windowStart) {
    // Zurücksetzen, wenn der Zeitraum abgelaufen ist
    rateLimitCache[ip] = { count: 0, timestamp: now };
  }
  
  // Prüfen, ob das Limit überschritten wurde
  if (rateLimitCache[ip].count >= MAX_REQUESTS_PER_IP) {
    const retryAfter = Math.ceil((rateLimitCache[ip].timestamp + RATE_LIMIT_WINDOW - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Zähler erhöhen
  rateLimitCache[ip].count += 1;
  return { allowed: true };
}

// Hilfsfunktion für Retry-Logik mit exponentiellem Backoff
async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Prüfen, ob es sich um einen Rate-Limiting-Fehler handelt (HTTP 429)
    if ((error.status === 429 || (error.message && error.message.includes('rate limit'))) && retries > 0) {
      const delay = BASE_DELAY * Math.pow(2, MAX_RETRIES - retries);
      console.log(`Rate-Limit erreicht, warte ${delay}ms vor Retry (${retries} verbleibend)`);
      
      // Warten vor dem nächsten Versuch
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Rekursiver Aufruf mit einem Retry weniger
      return retryOperation(operation, retries - 1);
    }
    
    // Bei anderen Fehlern oder wenn keine Retries mehr übrig sind, den Fehler weiterleiten
    throw error;
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
      error: 'Serverfehler: Umgebungsvariablen fehlen',
      details: 'Bitte kontaktieren Sie den Administrator.'
    });
  }

  // Nur POST-Anfragen zulassen
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }
  
  // IP-Adresse des Clients ermitteln für Rate-Limiting
  const clientIp = req.headers['x-forwarded-for'] as string || 
                  req.socket.remoteAddress || 
                  'unknown';
  
  // Rate-Limiting prüfen
  const rateLimitCheck = checkRateLimit(clientIp);
  if (!rateLimitCheck.allowed) {
    console.log(`Rate-Limit überschritten für IP: ${clientIp}`);
    res.setHeader('Retry-After', String(rateLimitCheck.retryAfter || 3600));
    return res.status(429).json({ 
      error: 'Zu viele Anfragen', 
      details: `Bitte versuchen Sie es in ${Math.ceil((rateLimitCheck.retryAfter || 3600) / 60)} Minuten erneut.`
    });
  }

  try {
    // Daten aus der Anfrage extrahieren
    const { email, password, firstName, lastName, restaurantName, role } = req.body;

    // Validierung der Eingabedaten
    if (!email || !password || !firstName || !lastName || !restaurantName) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage', 
        details: 'Alle Felder müssen ausgefüllt sein.' 
      });
    }

    // Supabase SSR-Client (ANON) für signUp verwenden (triggert Confirm signup E-Mail via Mailer)
    let supabaseSSR;
    try {
      supabaseSSR = createClient({ req, res });
    } catch (e: any) {
      console.error('Fehler beim Erstellen des Supabase SSR-Clients:', e);
      return res.status(500).json({ 
        error: 'Serverfehler: Supabase-Client (SSR) fehlgeschlagen',
        details: e.message || 'Unbekannter Fehler'
      });
    }

    // Überprüfen, ob die Site-URL konfiguriert ist (für die Bestätigungs-E-Mails von Supabase)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      console.error('NEXT_PUBLIC_SITE_URL ist nicht definiert');
      return res.status(500).json({ 
        error: 'Server-Konfigurationsfehler',
        details: 'Bitte kontaktieren Sie den Administrator.'
      });
    }

    // Benutzer-Registrierung via signUp (triggert Confirm signup E-Mail gemäß Template)
    const { data, error } = await retryOperation(async () => {
      const result = await supabaseSSR.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
            restaurant_name: restaurantName,
            role: role || 'customer'
          }
        }
      });
      return result;
    });

    if (error) {
      console.error('Fehler beim Erstellen des Benutzers:', error);
      
      // Prüfen, ob der Fehler darauf hinweist, dass der Benutzer bereits existiert
      const errorMessage = error as Error;
      if (errorMessage && errorMessage.message && (errorMessage.message.includes('already been registered') || 
                           errorMessage.message.includes('already exists') || 
                           errorMessage.message.includes('already registered'))) {
        return res.status(409).json({ 
          error: 'Benutzer existiert bereits', 
          details: 'Ein Benutzer mit dieser E-Mail-Adresse ist bereits registriert. Bitte verwenden Sie eine andere E-Mail-Adresse oder versuchen Sie sich anzumelden.'
        });
      }
      
      return res.status(400).json({ 
        error: 'Benutzerregistrierung fehlgeschlagen', 
        details: (error as Error).message || 'Unbekannter Fehler' 
      });
    }

    // Erfolgreiche Antwort senden – Hinweis: Profil/Restaurant werden nach Bestätigung in /auth/confirm angelegt
    return res.status(201).json({ 
      success: true, 
      message: 'Benutzer erfolgreich registriert – bitte E-Mail bestätigen',
    });

  } catch (error: any) {
    console.error('Unerwarteter Fehler bei der Benutzerregistrierung:', error);
    
    // Prüfen, ob es sich um einen Rate-Limiting-Fehler handelt
    if (error.status === 429 || (error.message && error.message.includes('rate limit'))) {
      console.error('Rate-Limiting-Fehler erkannt');
      return res.status(429).json({
        error: 'Zu viele Anfragen', 
        details: 'Bitte versuchen Sie es in einigen Minuten erneut.'
      });
    }
    
    // Versuchen, den Benutzer zu löschen, falls er erstellt wurde aber ein anderer Fehler auftrat
    try {
      if (user && user.id) {
        if (!supabaseAdmin) {
          throw new Error('Supabase Admin Client ist nicht initialisiert');
        }
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error('Fehler beim Löschen des Benutzers nach unbekanntem Fehler:', deleteError);
        } else {
          console.log('Benutzer nach unbekanntem Fehler gelöscht:', user.id);
        }
      }
    } catch (deleteError) {
      console.error('Fehler beim Löschen des Benutzers nach unbekanntem Fehler:', deleteError);
    }

    return res.status(500).json({ 
      error: 'Serverfehler bei der Benutzerregistrierung', 
      details: error.message || 'Unbekannter Fehler'
    });
  }
}
