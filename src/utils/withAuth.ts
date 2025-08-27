import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { createClient } from './supabase/server';
import { User } from '@supabase/supabase-js';

// Type for the wrapped getServerSideProps function, which receives the user object.
export type AuthenticatedGetServerSideProps<P extends { [key: string]: any }> = (
  context: GetServerSidePropsContext,
  user: User
) => Promise<GetServerSidePropsResult<P>>;

/**
 * A higher-order function to protect server-side rendered pages.
 * It ensures a user is authenticated and has the required role(s).
 *
 * @param requiredRoles The role or roles the user must have to access the page.
 * @param getServerSidePropsFunc The original getServerSideProps function for the page.
 * @returns A standard GetServerSideProps function that performs the auth check.
 */
export function withAuth<P extends { [key: string]: any }>(
  requiredRoles: string | string[],
  getServerSidePropsFunc: AuthenticatedGetServerSideProps<P>
): GetServerSideProps<P & { user: User }> {
  return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P & { user: User }>> => {
    console.log('withAuth: Ausführung für Pfad', context.resolvedUrl);
    console.log('withAuth: Cookies', context.req.cookies);
    
    const supabase = createClient(context);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('withAuth: Benutzer gefunden?', !!user);
    if (error) {
      console.error('withAuth: Fehler beim Abrufen des Benutzers:', error);
    }

    // 1. Check for a valid user session
    if (!user) {
      console.log('withAuth: Keine Benutzersession gefunden, Weiterleitung zur Login-Seite');
      console.log('withAuth: Weiterleitungs-URL:', `/auth/login?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`);
      return {
        redirect: {
          destination: `/auth/login?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
          permanent: false,
        },
      };
    }

    // 2. Check if the user has the required role
    const userRole = user.user_metadata?.role || 'USER';
    console.log('withAuth: Benutzerrolle:', userRole);
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    console.log('withAuth: Erforderliche Rollen:', roles);

    if (!roles.includes(userRole)) {
      console.log('withAuth: Benutzer hat nicht die erforderliche Rolle, Weiterleitung zur Startseite');
      // User is logged in but doesn't have the right role. Redirect to home.
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    // 3. If authenticated and authorized, execute the original function
    console.log('withAuth: Benutzer authentifiziert und autorisiert, führe ursprüngliche Funktion aus');
    const result = await getServerSidePropsFunc(context, user);

    // 4. Inject the user object into the props
    if ('props' in result) {
      const props = await Promise.resolve(result.props);
      return {
        ...result,
        props: {
          ...props,
          user,
        },
      };
    }

    // 5. If there are no props (e.g., a redirect or notFound), return as is
    return result;
  };
}
