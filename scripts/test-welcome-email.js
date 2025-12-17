// Skript zum Testen der automatischen Willkommens-E-Mail
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Umgebungsvariablen NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generiere eine zufällige E-Mail-Adresse für den Test
const generateRandomEmail = () => {
  const timestamp = new Date().getTime();
  return `test-user-${timestamp}@example.com`;
};

// Erstelle einen neuen Testbenutzer mit der Rolle "CUSTOMER"
async function createTestUser() {
  const testEmail = generateRandomEmail();
  const testPassword = 'Test123!@#';
  const testName = 'Test User';

  try {
    console.log(`Erstelle Testbenutzer mit E-Mail: ${testEmail}`);
    
    // Benutzer erstellen
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        role: 'CUSTOMER',
        first_name: 'Test',
        last_name: 'User'
      }
    });

    if (authError) {
      throw authError;
    }

    console.log('Benutzer erfolgreich erstellt:', authData.user.id);

    // Profil erstellen (falls nicht automatisch durch Trigger erstellt)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: testName,
        email: testEmail,
        role: 'CUSTOMER'
      });

    if (profileError) {
      console.warn('Fehler beim Erstellen des Profils (möglicherweise bereits durch Trigger erstellt):', profileError);
    } else {
      console.log('Profil erfolgreich erstellt');
    }

    // Manuell den Webhook aufrufen, um die Willkommens-E-Mail zu senden
    console.log('Rufe Webhook manuell auf, um die Willkommens-E-Mail zu senden...');
    
    const webhookUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('SUPABASE_WEBHOOK_SECRET muss gesetzt sein');
      return;
    }

    const response = await fetch(`${webhookUrl}/api/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`
      },
      body: JSON.stringify({
        event: 'INSERT',
        table: 'profiles',
        record: {
          id: authData.user.id,
          email: testEmail,
          name: testName,
          role: 'CUSTOMER'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook-Aufruf fehlgeschlagen: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Webhook-Antwort:', result);
    console.log('Test abgeschlossen. Überprüfen Sie die Logs, um zu sehen, ob die Willkommens-E-Mail gesendet wurde.');

  } catch (error) {
    console.error('Fehler beim Testen der Willkommens-E-Mail:', error);
  }
}

createTestUser();
