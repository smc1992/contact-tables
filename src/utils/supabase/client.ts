import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../../types/supabase';

export function createClient() {
  console.log('Client createClient: Erstelle Browser-Client');
  
  // Debugging: Prüfe, ob die Umgebungsvariablen verfügbar sind
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Client: Supabase URL oder Anon Key fehlen in der Konfiguration.');
  }
  
  // Bestimme, ob wir in Produktion sind und auf welcher Domain
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecureContext = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isCustomDomain = hostname.includes('contact-tables.org');
  const isNetlifyDomain = hostname.includes('netlify.app');
  
  // Cookie-Optionen basierend auf der Umgebung konfigurieren
  const cookieOptions = {
    name: 'contact-tables-auth',
    maxAge: 60 * 60 * 24 * 7, // 7 Tage
    sameSite: 'lax' as 'lax', // Expliziter Typ für TypeScript
    path: '/',
    secure: isProduction || isSecureContext,
  };
  
  // Domain-Einstellung nur für die Haupt-Domain hinzufügen
  if (isProduction && isCustomDomain) {
    console.log('Client: Cookie Domain für .contact-tables.org gesetzt');
    Object.assign(cookieOptions, { domain: '.contact-tables.org' });
  }
  
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions
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
