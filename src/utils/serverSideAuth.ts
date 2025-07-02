import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';

type AuthenticatedProps = {
  user: User;
};

/**
 * A helper for `getServerSideProps` that requires a user to be authenticated.
 * If the user is not authenticated, it redirects to the login page.
 *
 * @param context The context from getServerSideProps.
 * @param callbackUrl An optional URL to redirect to after successful login.
 * @returns {Promise<GetServerSidePropsResult<AuthenticatedProps>>} An object with `props` containing the `user` object, or a `redirect` object.
 */
export const requireAuth = async (
  context: GetServerSidePropsContext,
  callbackUrl?: string
): Promise<GetServerSidePropsResult<AuthenticatedProps>> => {
  const supabase = createClient(context);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const destination = `/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`;
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  return { props: { user } };
};

/**
 * A helper for `getServerSideProps` that requires a user to be authenticated and have a specific role.
 * If the conditions are not met, it redirects.
 *
 * @param context The context from getServerSideProps.
 * @param role The required role or an array of roles.
 * @param callbackUrl An optional URL to redirect to after successful login.
 * @returns {Promise<GetServerSidePropsResult<AuthenticatedProps>>} An object with `props` containing the `user` object, or a `redirect` object.
 */
export const requireRole = async (
  context: GetServerSidePropsContext,
  role: string | string[],
  callbackUrl?: string
): Promise<GetServerSidePropsResult<AuthenticatedProps>> => {
  const authResult = await requireAuth(context, callbackUrl);

  // If the user is not authenticated (or another redirect occurred), pass through the result.
  if (!('props' in authResult)) {
    return authResult;
  }

  const props = await authResult.props;
  const user = props.user;
  const userRole = user.user_metadata?.role || 'USER'; // Default to USER if not set

  const hasRequiredRole = Array.isArray(role)
    ? role.includes(userRole)
    : userRole === role;

  if (!hasRequiredRole) {
    return {
      redirect: {
        destination: '/', // Redirect to home if role is not sufficient
        permanent: false,
      },
    };
  }

  return authResult;
};
