import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

/**
 * Middleware to authenticate and authorize admin users for API routes
 * 
 * @param handler The API route handler function
 * @returns A wrapped handler that performs auth checks before executing the original handler
 */
export function withAdminAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, userId: string) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Create server-side Supabase client using cookies
      const supabase = createClient({ req, res });
      
      // Get user from session
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.error('API Auth: Keine gültige Benutzersession gefunden');
        return res.status(401).json({ error: 'Nicht authentifiziert' });
      }
      
      // Check for admin role in app_metadata (secure) or user_metadata (fallback)
      const userRole = user.app_metadata?.role || user.user_metadata?.role || 'USER';
      const isAdmin = user.app_metadata?.is_admin === true;
      
      // Verify admin access
      const hasAdminAccess = 
        userRole === 'admin' || 
        userRole === 'ADMIN' || 
        isAdmin;
      
      if (!hasAdminAccess) {
        console.error('API Auth: Benutzer hat keine Admin-Berechtigung', { userId: user.id, role: userRole });
        return res.status(403).json({ error: 'Keine Berechtigung für diese Aktion' });
      }
      
      // User is authenticated and authorized as admin, proceed with the original handler
      return handler(req, res, user.id);
    } catch (error) {
      console.error('API Auth: Unerwarteter Fehler:', error);
      return res.status(500).json({ error: 'Interner Serverfehler bei der Authentifizierung' });
    }
  };
}
