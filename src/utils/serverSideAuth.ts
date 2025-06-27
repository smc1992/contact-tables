import { GetServerSidePropsContext } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

/**
 * Erstellt einen Supabase-Client für die serverseitige Verwendung
 * Verwendet die empfohlene Funktion createPagesServerClient statt der veralteten createServerSupabaseClient
 */
export const createServerSupabaseClient = (context: GetServerSidePropsContext) => {
  // Verwenden der empfohlenen Funktion createPagesServerClient
  return createPagesServerClient(context);
};

/**
 * Überprüft die Authentifizierung auf der Serverseite und gibt die Sitzung und den Benutzer zurück
 */
export const getServerAuthSession = async (context: GetServerSidePropsContext) => {
  const supabase = createServerSupabaseClient(context);
  const { data } = await supabase.auth.getSession();
  
  return {
    session: data.session,
    user: data.session?.user || null
  };
};

/**
 * Überprüft die Authentifizierung auf der Serverseite und gibt die Sitzung und den Benutzer zurück
 */
export const requireAuth = async (context: GetServerSidePropsContext, callbackUrl?: string) => {
  const { session, user } = await getServerAuthSession(context);
  
  if (!session || !user) {
    return {
      redirect: {
        destination: `/auth/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`,
        permanent: false,
      },
    };
  }
  
  return { props: { user, session } };
};

/**
 * Überprüft, ob der Benutzer eine bestimmte Rolle hat
 */
export const requireRole = async (context: GetServerSidePropsContext, role: string | string[], callbackUrl?: string) => {
  const result = await requireAuth(context, callbackUrl);
  
  // Wenn der Benutzer nicht authentifiziert ist, wird er bereits umgeleitet
  if ('redirect' in result) {
    return result;
  }
  
  const user = result.props.user;
  const userRole = user.user_metadata?.role || 'GUEST';
  
  const hasRequiredRole = Array.isArray(role) 
    ? role.includes(userRole) 
    : userRole === role;
  
  if (!hasRequiredRole) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  return result;
};
