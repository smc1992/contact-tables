import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Diese Funktion setzt das Passwort für einen Admin-Benutzer zurück
Deno.serve(async (req) => {
  try {
    // Umgebungsvariablen abrufen
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Umgebungsvariablen nicht konfiguriert' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Admin-Client mit Service-Role-Key erstellen
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Neues Passwort generieren (oder ein festes verwenden)
    const newPassword = 'ContactTables2025!'; // Sicheres Passwort
    
    // Admin-Benutzer-E-Mail
    const adminEmail = 'info@contact-tables.org';
    
    // Passwort zurücksetzen
    const { error } = await supabase.auth.admin.updateUserById(
      '18d032da-b347-47f2-8d31-453013288a88', // User-ID
      { password: newPassword }
    );
    
    if (error) {
      console.error('Fehler beim Zurücksetzen des Passworts:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Passwort für ${adminEmail} wurde zurückgesetzt`,
        newPassword: newPassword
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
    return new Response(
      JSON.stringify({ error: 'Ein unerwarteter Fehler ist aufgetreten' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
