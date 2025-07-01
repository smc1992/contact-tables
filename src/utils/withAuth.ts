import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { createClient } from './supabase/server';
import { User } from '@supabase/supabase-js';

// Define a type for the function that will be wrapped
type AuthenticatedGetServerSideProps = (
  context: GetServerSidePropsContext,
  user: User
) => Promise<GetServerSidePropsResult<any>>;

/**
 * A higher-order function to protect server-side rendered pages.
 * It checks for a valid user session and the required role before executing the original getServerSideProps.
 *
 * @param requiredRole The role the user must have to access the page.
 * @param getServerSidePropsFunc The original getServerSideProps function for the page.
 */
export function withAuth(
  requiredRole: 'RESTAURANT' | 'ADMIN',
  getServerSidePropsFunc: AuthenticatedGetServerSideProps
): GetServerSideProps {
  return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<any>> => {
    const supabase = createClient(context);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        redirect: {
          destination: `/auth/login?callbackUrl=${context.resolvedUrl}`,
          permanent: false,
        },
      };
    }

    // If no user is found or the user does not have the required role, redirect to login.
    if (user.user_metadata?.role !== requiredRole) {
      return {
        redirect: {
          destination: `/auth/login?callbackUrl=${context.resolvedUrl}`,
          permanent: false,
        },
      };
    }

    // If the user is authenticated, get the session and execute the original function.
    const { data: { session } } = await supabase.auth.getSession();
    const result = await getServerSidePropsFunc(context, user);

    // Check if the result has props and merge the session into them
    if ('props' in result) {
      return {
        ...result,
        props: {
          ...result.props,
          initialSession: session,
          user,
        },
      };
    }

    // If there are no props (e.g., a redirect), return the result as is
    return result;
  };
}
