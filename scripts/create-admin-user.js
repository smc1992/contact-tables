// create-admin-user.js
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

// Supabase-Konfiguration aus .env-Datei
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Admin-Benutzer-Konfiguration
const EMAIL = 'info@contact-tables.org';
const PASSWORD = crypto.randomBytes(12).toString('hex');

// Erstelle Supabase-Client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createOrResetAdminUser() {
  console.log('Starte Admin-Benutzer-Verwaltung...');
  
  try {
    // 1. Versuche, einen neuen Benutzer zu registrieren
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: EMAIL,
      password: PASSWORD,
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (signUpError && signUpError.message !== 'User already registered') {
      console.error('Fehler bei der Registrierung:', signUpError.message);
      return;
    }

    if (signUpData?.user) {
      console.log(`Neuer Admin-Benutzer ${EMAIL} wurde erstellt.`);
      console.log('----------------------------------------');
      console.log('Zugangsdaten für den Admin-Benutzer:');
      console.log(`E-Mail: ${EMAIL}`);
      console.log(`Passwort: ${PASSWORD}`);
      console.log('----------------------------------------');
      console.log('Bitte ändern Sie das Passwort nach dem ersten Login.');
      return;
    }

    // 2. Wenn der Benutzer bereits existiert, versuche ein Passwort-Reset
    console.log(`Benutzer ${EMAIL} existiert bereits. Sende Passwort-Reset-Link...`);
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      EMAIL,
      { redirectTo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password` }
    );

    if (resetError) {
      console.error('Fehler beim Senden des Passwort-Reset-Links:', resetError.message);
      return;
    }

    console.log(`Passwort-Reset-Link wurde an ${EMAIL} gesendet.`);
    console.log('Bitte prüfen Sie Ihren E-Mail-Eingang und folgen Sie dem Link, um ein neues Passwort zu setzen.');
    
  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
  }
}

createOrResetAdminUser();
