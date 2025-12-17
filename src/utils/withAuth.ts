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
  // Server-Side Auth mit getServerSideProps
  return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P & { user: User }>> => {
    try {
      // Wenn wir uns im Build-Prozess befinden oder keine Request vorhanden ist (statische Generierung),
      // geben wir notFound zurück, um diese Seite vom statischen Export auszuschließen
      if (!context.req || process.env.NEXT_PHASE === 'phase-export') {
        return {
          notFound: true
        };
      }
      
      console.log('withAuth: Ausführung für Pfad', context.resolvedUrl);
      
      const supabase = createClient(context);
      const { data: { user }, error } = await supabase.auth.getUser();
      
      console.log('withAuth: Benutzer gefunden?', !!user);
      if (error) {
        console.error('withAuth: Fehler beim Abrufen des Benutzers:', error);
      }

      // 1. Check for a valid user session
      if (!user) {
        console.log('withAuth: Keine Benutzersession gefunden, Weiterleitung zur Login-Seite');
        return {
          redirect: {
            destination: `/auth/login?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
            permanent: false,
          },
        };
      }

      // 2. Check if the user has the required role - using app_metadata for security
      // app_metadata can only be set by server-side code, user_metadata can be modified by the user
      const userRole = user.app_metadata?.role || user.user_metadata?.role || 'USER';
      const isAdmin = user.app_metadata?.is_admin === true;
      console.log('withAuth: Benutzerrolle:', userRole, 'isAdmin:', isAdmin);
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      console.log('withAuth: Erforderliche Rollen:', roles);
      
      // Check if user has required role or is explicitly marked as admin
      const hasRequiredRole = roles.includes(userRole) || 
                             (roles.includes('admin') && (userRole === 'ADMIN')) || 
                             (roles.includes('ADMIN') && (userRole === 'admin')) ||
                             (isAdmin && (roles.includes('admin') || roles.includes('ADMIN')));
      
      if (!hasRequiredRole) {
        console.log('withAuth: Benutzer hat nicht die erforderliche Rolle, Weiterleitung zur 403-Seite');
        return {
          redirect: {
            destination: '/403',
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
    } catch (error) {
      console.error('withAuth: Unerwarteter Fehler:', error);
      return {
        redirect: {
          destination: '/auth/login',
          permanent: false,
        },
      };
    }
  };
}
