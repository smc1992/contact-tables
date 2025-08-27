import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * A higher-order component to protect client-side rendered pages.
 * It ensures a user is authenticated and has the required role(s).
 *
 * @param Component The component to wrap with authentication
 * @param requiredRoles The role or roles the user must have to access the page
 * @returns A wrapped component that performs the auth check
 */
export function withClientAuth<P extends {}>(
  Component: React.ComponentType<P>,
  requiredRoles: string | string[]
): React.FC<P> {
  return function ProtectedComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      // Wait until auth state is determined
      if (loading) return;
      
      // If no user, redirect to login
      if (!user) {
        router.push(`/auth/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
        return;
      }
      
      // Check if user has required role
      const userRole = user.user_metadata?.role || 'USER';
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(userRole)) {
        // User doesn't have required role, redirect to home
        router.push('/');
      }
    }, [user, loading, router]);
    
    // Show nothing while loading or redirecting
    if (loading || !user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }
    
    // Check role after loading
    const userRole = user.user_metadata?.role || 'USER';
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    if (!roles.includes(userRole)) {
      return null; // Will be redirected by the useEffect
    }
    
    // User is authenticated and authorized, render the component
    return <Component {...props} />;
  };
}
