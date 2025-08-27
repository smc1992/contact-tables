import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentifizierung und Rollenprüfung
    const supabase = createClient({ req, res });
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }
    
    const userRole = user.user_metadata?.role?.toLowerCase();
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    // Tags mit Anzahl der zugewiesenen Benutzer abrufen
    const tags = await prisma.$queryRaw<Array<{id: string, name: string, description: string | null, userCount: number}>>`
      SELECT 
        ut.id, 
        ut.name, 
        ut.description, 
        COUNT(uta.id) as "userCount" 
      FROM "user_tags" ut
      LEFT JOIN "user_tag_assignments" uta ON ut.id = uta.tag_id
      GROUP BY ut.id, ut.name, ut.description
      ORDER BY ut.name ASC
    `;

    // Tags sind bereits im richtigen Format

    return res.status(200).json({ tags });
  } catch (error) {
    console.error('Fehler beim Abrufen der Tags:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}
