import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Lade Umgebungsvariablen aus .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Umgebungsvariablen NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein');
  process.exit(1);
}

// Erstelle Supabase-Client mit Service-Rolle für Admin-Zugriff
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingProfiles() {
  try {
    console.log('Suche nach Benutzern ohne Profile...');
    
    // Direkte SQL-Abfrage, um Benutzer ohne Profile zu finden
    const { data: usersWithoutProfiles, error } = await supabase.from('auth.users')
      .select('id, email, created_at, last_sign_in_at')
      .not('id', 'in', (supabase.from('profiles').select('id')));
    
    if (error) {
      throw error;
    }
    
    if (!usersWithoutProfiles || usersWithoutProfiles.length === 0) {
      console.log('Keine Benutzer ohne Profile gefunden.');
      return;
    }
    
    console.log(`Gefunden: ${usersWithoutProfiles.length} Benutzer ohne Profil`);
    
    // Erstelle Profile für jeden Benutzer ohne Profil
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithoutProfiles) {
      try {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            role: 'CUSTOMER',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error(`Fehler beim Erstellen des Profils für ${user.email}:`, insertError);
          errorCount++;
        } else {
          console.log(`Profil für ${user.email} erfolgreich erstellt`);
          successCount++;
        }
      } catch (e) {
        console.error(`Unerwarteter Fehler beim Erstellen des Profils für ${user.email}:`, e);
        errorCount++;
      }
    }
    
    console.log(`Zusammenfassung: ${successCount} Profile erstellt, ${errorCount} Fehler`);
  } catch (error) {
    console.error('Fehler beim Erstellen fehlender Profile:', error);
  }
}

// Führe das Skript aus
createMissingProfiles()
  .then(() => {
    console.log('Skript abgeschlossen');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unerwarteter Fehler:', error);
    process.exit(1);
  });
