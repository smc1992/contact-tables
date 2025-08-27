import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../../types/supabase';

export function createClient() {
  console.log('Client createClient: Erstelle Browser-Client');
  
  // Debugging: Prüfe, ob die Umgebungsvariablen verfügbar sind
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Client: Supabase URL oder Anon Key fehlen in der Konfiguration.');
  }
  
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'contact-tables-auth',
        // Stellen Sie sicher, dass die Cookie-Optionen mit dem Server übereinstimmen
        maxAge: 60 * 60 * 24 * 7, // 7 Tage
        sameSite: 'lax',
        path: '/',
      }
    }
  );
  
  // Debugging: Session-Status prüfen
  client.auth.getSession().then(({ data }) => {
    console.log('Client createClient: Session vorhanden?', !!data.session);
  }).catch(error => {
    console.error('Client createClient: Fehler beim Abrufen der Session:', error);
  });
  
  return client;
}
