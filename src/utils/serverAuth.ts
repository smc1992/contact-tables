import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

/**
 * Erstellt einen Supabase-Client für die Serverseite
 * Verwendet die empfohlene Funktion createPagesServerClient statt der veralteten createServerSupabaseClient
 */
export const createServerSupabaseClient = (req: NextApiRequest, res: NextApiResponse) => {
  // Verwenden der empfohlenen Funktion createPagesServerClient
  return createPagesServerClient({ req, res });
};

/**
 * Überprüft die Authentifizierung und gibt die Sitzung und den Benutzer zurück
 * @returns Ein Objekt mit der Sitzung und dem Benutzer oder null, wenn nicht authentifiziert
 */
export const getServerSession = async (req: NextApiRequest, res: NextApiResponse) => {
  const supabase = createServerSupabaseClient(req, res);
  const { data } = await supabase.auth.getSession();
  
  if (!data.session) {
    return { session: null, user: null };
  }
  
  return { session: data.session, user: data.session.user };
};

/**
 * Überprüft, ob der Benutzer eine bestimmte Rolle hat
 */
export const hasRole = (user: any, role: string | string[]) => {
  if (!user) return false;
  
  const userRole = user.user_metadata?.role || 'GUEST';
  
  if (Array.isArray(role)) {
    return role.includes(userRole);
  }
  
  return userRole === role;
};

/**
 * Middleware für API-Routen, die Authentifizierung erfordert
 */
export const withAuth = (handler: any) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { session, user } = await getServerSession(req, res);
    
    if (!session || !user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }
    
    // Füge Sitzung und Benutzer zum Request hinzu
    (req as any).session = session;
    (req as any).user = user;
    
    return handler(req, res);
  };
};

/**
 * Middleware für API-Routen, die eine bestimmte Rolle erfordern
 */
export const withRole = (handler: any, role: string | string[]) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { session, user } = await getServerSession(req, res);
    
    if (!session || !user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }
    
    if (!hasRole(user, role)) {
      return res.status(403).json({ message: 'Unzureichende Berechtigungen' });
    }
    
    // Füge Sitzung und Benutzer zum Request hinzu
    (req as any).session = session;
    (req as any).user = user;
    
    return handler(req, res);
  };
};
