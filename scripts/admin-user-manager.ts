import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomBytes } from 'crypto';

// Lade Umgebungsvariablen
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Überprüfe, ob die erforderlichen Umgebungsvariablen vorhanden sind
if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ist nicht definiert');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY ist nicht definiert in der .env-Datei');
  console.error('Bitte fügen Sie den Service Role Key zu Ihrer .env-Datei hinzu:');
  console.error('SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

// Erstelle Supabase-Client mit Service-Role-Key für Admin-Zugriff
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EMAIL = 'info@contact-tables.org';

// Generiere ein sicheres Passwort
function generateSecurePassword(length = 12) {
  const buffer = randomBytes(length);
  return buffer.toString('base64').replace(/[+/=]/g, '').substring(0, length);
}

async function manageAdminUser() {
  try {
    // Prüfe, ob der Benutzer bereits existiert
    const { data: existingUser, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', EMAIL)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Fehler beim Suchen des Benutzers:', userError);
      return;
    }

    const password = generateSecurePassword();
    
    if (existingUser) {
      console.log(`Benutzer ${EMAIL} existiert bereits. Setze Passwort zurück...`);
      
      // Passwort zurücksetzen
      const { error: resetError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );

      if (resetError) {
        console.error('Fehler beim Zurücksetzen des Passworts:', resetError);
        return;
      }

      // Stelle sicher, dass der Benutzer Admin-Rechte hat
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { user_metadata: { role: 'admin' } }
      );

      if (updateError) {
        console.error('Fehler beim Aktualisieren der Benutzerrolle:', updateError);
        return;
      }

      console.log(`Passwort für ${EMAIL} wurde zurückgesetzt.`);
    } else {
      console.log(`Erstelle neuen Admin-Benutzer ${EMAIL}...`);
      
      // Erstelle neuen Benutzer
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password,
        email_confirm: true,
        user_metadata: { role: 'admin' }
      });

      if (createError) {
        console.error('Fehler beim Erstellen des Benutzers:', createError);
        return;
      }

      console.log(`Neuer Admin-Benutzer ${EMAIL} wurde erstellt.`);
    }

    console.log('----------------------------------------');
    console.log('Zugangsdaten für den Admin-Benutzer:');
    console.log(`E-Mail: ${EMAIL}`);
    console.log(`Passwort: ${password}`);
    console.log('----------------------------------------');
    console.log('Bitte ändern Sie das Passwort nach dem ersten Login.');

  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
  }
}

manageAdminUser();
