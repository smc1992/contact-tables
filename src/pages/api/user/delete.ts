import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  console.log('API Route /api/user/delete called. Method:', req.method);
  console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request Cookies (parsed by Next.js):', JSON.stringify(req.cookies, null, 2));

  // Log Supabase-specific cookies
  const supabaseCookiePrefix = 'contact-tables-auth'; // Adjusted to custom cookie name // Default prefix, adjust if custom
  console.log('--- Supabase Cookie Details ---');
  for (const cookieName in req.cookies) {
    if (cookieName.startsWith(supabaseCookiePrefix) && cookieName.includes('-auth-token')) {
      console.log(`Found Supabase auth token cookie: ${cookieName}`); // Value is sensitive, so not logging full value
    } else if (cookieName.startsWith(supabaseCookiePrefix)) {
      console.log(`Found Supabase cookie: ${cookieName}`);
    }
  }
  console.log('--- End Supabase Cookie Details ---');

  // Log environment variables to ensure they are loaded server-side
  console.log('Server-side NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Loaded' : 'MISSING!');
  console.log('Server-side NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'MISSING!');

  const supabaseServerClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: 'contact-tables-auth' },
      cookies: {
        get(name: string) {
          return req.cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          // Avoid setting cookies in a DELETE response unless necessary
        },
        remove(name: string, options: CookieOptions) {
          // Avoid setting cookies in a DELETE response unless necessary
        },
      },
    }
  );

  const { data: { session: serverSession }, error: sessionError } = await supabaseServerClient.auth.getSession();

  let jwt: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    jwt = authHeader.substring(7);
    console.log('Extracted JWT from header:', jwt.substring(0, 20) + '...');
  }

  try {
    if (serverSession) {
      console.log('Attempting account deletion using server session for user ID:', serverSession.user.id);
      const { error: deleteError } = await supabaseServerClient.functions.invoke('delete-user-account');

      if (deleteError) {
        console.error('Error invoking Supabase function with session:', deleteError);
        let status = 500;
        let message = 'Fehler beim Löschen des Benutzerkontos.';
        if (deleteError && typeof deleteError === 'object' && 'context' in deleteError && deleteError.context && typeof deleteError.context === 'object' && 'status' in deleteError.context && typeof deleteError.context.status === 'number') {
            status = deleteError.context.status;
            message = deleteError.message || message;
        } else if (deleteError && typeof deleteError === 'object' && 'status' in deleteError && typeof deleteError.status === 'number') {
            status = deleteError.status; 
            message = deleteError.message || message;
        }
        return res.status(status).json({ message });
      }

      console.log('Supabase function invoked successfully with session. Account deletion process initiated.');
      // Optionally clear cookies here if needed, though Supabase handles session invalidation
      // res.setHeader('Set-Cookie', cookie.serialize('contact-tables-auth-token', '', { maxAge: -1, path: '/' }));
      return res.status(200).json({ message: 'Benutzerkonto erfolgreich zum Löschen vorgemerkt.' });

    } else if (jwt) {
      console.log('No active session found via cookies. Attempting account deletion using JWT from Authorization header.');
      const { error: deleteError } = await supabaseServerClient.functions.invoke('delete-user-account', {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (deleteError) {
        console.error('Error invoking Supabase function with JWT:', deleteError);
        let status = 500;
        let message = 'Fehler beim Löschen des Benutzerkontos mit JWT.';
        if (deleteError && typeof deleteError === 'object' && 'context' in deleteError && deleteError.context && typeof deleteError.context === 'object' && 'status' in deleteError.context && typeof deleteError.context.status === 'number') {
            status = deleteError.context.status;
            message = deleteError.message || message;
        } else if (deleteError && typeof deleteError === 'object' && 'status' in deleteError && typeof deleteError.status === 'number') {
            status = deleteError.status; 
            message = deleteError.message || message;
        }
        return res.status(status).json({ message });
      }

      console.log('Supabase function invoked successfully with JWT. Account deletion process initiated.');
      return res.status(200).json({ message: 'Benutzerkonto erfolgreich zum Löschen vorgemerkt (via JWT).' });

    } else {
      console.log('No session or JWT found. Unauthorized.');
      return res.status(401).json({ message: 'Nicht autorisiert. Keine gültige Sitzung oder Token gefunden.' });
    }
  } catch (e: any) {
    console.error('Unerwarteter Fehler in der API-Route /api/user/delete:', e);
    return res.status(500).json({ message: e.message || 'Ein interner Serverfehler ist aufgetreten.' });
  }
}
