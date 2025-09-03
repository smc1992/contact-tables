import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../types/supabase';

type SupabaseServerContext = 
  | GetServerSidePropsContext
  | { req: NextApiRequest; res: NextApiResponse };

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Admin Client: URL vorhanden?', !!supabaseUrl);
  console.log('Admin Client: Service Key vorhanden?', !!supabaseServiceKey);
  console.log('Admin Client: Service Key Länge:', supabaseServiceKey ? supabaseServiceKey.length : 0);
  console.log('Admin Client: Umgebungsvariablen:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Admin Supabase configuration is missing:', {
      url: !!supabaseUrl,
      serviceKey: !!supabaseServiceKey
    });
    
    // Kein Fallback mehr zum Anon-Key, da dies zu Berechtigungsproblemen führt
    // Stattdessen werfen wir einen klaren Fehler
    throw new Error('Admin Supabase configuration is missing. SUPABASE_SERVICE_ROLE_KEY und NEXT_PUBLIC_SUPABASE_URL müssen in den Umgebungsvariablen gesetzt sein.');
  }

  try {
    console.log('Admin Client: Erstelle Supabase-Client mit Service Key');
    const client = createServerClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        cookies: {
          get() { return undefined; },
          set() {},
          remove() {},
        },
      }
    );
    console.log('Admin Client: Supabase-Client erfolgreich erstellt');
    return client;
  } catch (error) {
    console.error('Fehler beim Erstellen des Admin-Clients:', error);
    console.error('Fehler-Details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw new Error('Fehler beim Erstellen des Admin-Clients: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export function createClient(context: SupabaseServerContext) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Im Idealfall sollte dies auf Serverseite nie passieren, da die App sonst nicht starten sollte.
    // Aber eine Überprüfung schadet nicht.
    console.error('Server: Supabase URL oder Anon Key fehlen in der Konfiguration.');
    // Hier könnte man einen Fehler werfen oder eine Null-Implementierung zurückgeben,
    // abhängig von der gewünschten Fehlerbehandlung.
    throw new Error('Server-side Supabase configuration is missing.');
  }
  
  // Debug-Ausgabe der Cookies
  console.log('Server createClient: Verfügbare Cookies:', context.req.cookies);
  const authCookie = context.req.cookies['contact-tables-auth'];
  console.log('Server createClient: Auth-Cookie vorhanden?', !!authCookie);

  // Protokolliere Domain-Informationen für Debugging
  const host = context.req.headers.host || '';
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';
  const origin = `${protocol}://${host}`;
  console.log('Server createClient: Request Host:', host);
  console.log('Server createClient: Request Protocol:', protocol);
  console.log('Server createClient: Request Origin:', origin);
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          // Prüfe alle Cookies für Debugging
          if (name === 'contact-tables-auth') {
            console.log('Alle verfügbaren Cookies:', Object.keys(context.req.cookies));
          }
          
          const cookie = context.req.cookies[name];
          console.log(`Server cookie get: ${name} = ${cookie ? 'vorhanden' : 'nicht vorhanden'}`);
          return cookie;
        },
        set(name: string, value: string, options: CookieOptions) {
          // context.res.setHeader('Set-Cookie', ...) ist der Standardweg, aber Next.js
          // hat manchmal Probleme mit mehrfachen setHeader-Aufrufen für Set-Cookie.
          // Eine sicherere Methode ist, ein Array von Cookie-Strings zu verwalten und
          // es am Ende zu setzen, oder context.res.appendHeader zu verwenden, falls verfügbar.
          // Für Pages Router ist setHeader meist ausreichend, wenn es korrekt verwendet wird.
          // Wichtig: Die Optionen müssen korrekt formatiert werden.
          console.log(`Server cookie set: ${name} = [Wert gekürzt]`);
          console.log('Server cookie options:', options);
          
          // Bestimme die Domain für das Cookie
          const host = context.req.headers.host || '';
          const isProduction = process.env.NODE_ENV === 'production';
          const isCustomDomain = host.includes('contact-tables.org');
          const isNetlifyDomain = host.includes('netlify.app');
          
          // Cookie-Teile zusammenstellen
          const cookieParts = [
            `${name}=${value}`,
            `Path=${options.path || '/'}`,
            `Max-Age=${options.maxAge}`,
            `SameSite=${options.sameSite || 'Lax'}`,
          ];
          
          // Domain-Logik für verschiedene Umgebungen
          if (isProduction) {
            if (isCustomDomain) {
              // Für die Haupt-Domain
              cookieParts.push(`Domain=.contact-tables.org`);
              console.log('Cookie Domain gesetzt auf: .contact-tables.org');
            } else if (isNetlifyDomain) {
              // Für Netlify-Subdomains - keine Domain setzen, damit der Browser die aktuelle Domain verwendet
              console.log('Netlify-Domain erkannt, verwende Standard-Domain-Verhalten');
            }
          }

          if (options.httpOnly !== false) {
            cookieParts.push('HttpOnly');
          }
          
          // In Produktion immer Secure setzen, wenn wir HTTPS verwenden
          const protocol = context.req.headers['x-forwarded-proto'] || 'http';
          const useSecure = isProduction || protocol === 'https' || options.secure;
          
          if (useSecure) {
            cookieParts.push('Secure');
            console.log('Cookie als Secure markiert');
          }

          const cookieString = cookieParts.join('; ');
          console.log('Server cookie string:', cookieString);
          
          // Um sicherzustellen, dass wir nicht versuchen, auf ein nicht existentes res-Objekt zuzugreifen
          if (context.res) {
            const existingCookies = context.res.getHeader('Set-Cookie');
            console.log('Server existing cookies:', existingCookies);
            
            let newCookies: string[] = [];
            if (typeof existingCookies === 'string') {
              newCookies.push(existingCookies);
            } else if (Array.isArray(existingCookies)) {
              newCookies = [...existingCookies];
            }
            newCookies.push(cookieString);
            context.res.setHeader('Set-Cookie', newCookies);
            console.log('Server set cookies header with', newCookies.length, 'cookies');
          } else {
            console.warn('Server: context.res ist nicht verfügbar, kann Cookie nicht setzen');
          }
        },
        remove(name: string, options: CookieOptions) {
          const cookieParts = [
            `${name}=`,
            `Path=${options.path || '/'}`,
            `Max-Age=0`,
            `SameSite=${options.sameSite || 'Lax'}`,
          ];

          if (options.httpOnly !== false) {
            cookieParts.push('HttpOnly');
          }
          if (options.secure) {
            cookieParts.push('Secure');
          }
          
          const cookieString = cookieParts.join('; ');
          if (context.res) {
            const existingCookies = context.res.getHeader('Set-Cookie');
            let newCookies: string[] = [];
            if (typeof existingCookies === 'string') {
              newCookies.push(existingCookies);
            } else if (Array.isArray(existingCookies)) {
              newCookies = [...existingCookies];
            }
            newCookies.push(cookieString);
            context.res.setHeader('Set-Cookie', newCookies);
          }
        },
      },
      cookieOptions: {
        name: 'contact-tables-auth',
        // Stellen Sie sicher, dass die Cookie-Optionen konsistent sind
        maxAge: 60 * 60 * 24 * 7, // 7 Tage
        sameSite: 'lax',
        path: '/',
        // Secure wird automatisch basierend auf der Umgebung gesetzt
        secure: process.env.NODE_ENV === 'production',
      },
    }
  );
}
