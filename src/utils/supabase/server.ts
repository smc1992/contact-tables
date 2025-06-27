import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../types/supabase';

type SupabaseServerContext = 
  | GetServerSidePropsContext
  | { req: NextApiRequest; res: NextApiResponse };

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

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return context.req.cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          // context.res.setHeader('Set-Cookie', ...) ist der Standardweg, aber Next.js
          // hat manchmal Probleme mit mehrfachen setHeader-Aufrufen für Set-Cookie.
          // Eine sicherere Methode ist, ein Array von Cookie-Strings zu verwalten und
          // es am Ende zu setzen, oder context.res.appendHeader zu verwenden, falls verfügbar.
          // Für Pages Router ist setHeader meist ausreichend, wenn es korrekt verwendet wird.
          // Wichtig: Die Optionen müssen korrekt formatiert werden.
          let cookieString = `${name}=${value}; Path=${options.path || '/'}; Max-Age=${options.maxAge}; SameSite=${options.sameSite || 'Lax'}; HttpOnly=${options.httpOnly !== false}`;
          if (options.secure) {
            cookieString += '; Secure';
          }
          // Um sicherzustellen, dass wir nicht versuchen, auf ein nicht existentes res-Objekt zuzugreifen
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
        remove(name: string, options: CookieOptions) {
          let cookieString = `${name}=; Path=${options.path || '/'}; Max-Age=0; SameSite=${options.sameSite || 'Lax'}; HttpOnly=${options.httpOnly !== false}`;
          if (options.secure) {
            cookieString += '; Secure';
          }
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
      },
    }
  );
}
