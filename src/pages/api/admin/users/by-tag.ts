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

    // Tag-ID aus der Anfrage extrahieren
    const { tagId } = req.query;
    
    if (!tagId || typeof tagId !== 'string') {
      return res.status(400).json({ error: 'Tag-ID ist erforderlich' });
    }

    // Benutzer mit dem angegebenen Tag abrufen
    const usersWithTag = await prisma.$queryRaw<Array<{userId: string}>>`
      SELECT "user_id" as "userId" FROM "user_tag_assignments"
      WHERE "tag_id" = ${tagId}
    `;
    

    // Benutzer-IDs extrahieren
    const userIds = usersWithTag.map((assignment: { userId: string }) => assignment.userId);

    // Benutzerinformationen aus Supabase abrufen
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }

    // Nur Benutzer mit dem angegebenen Tag filtern und formatieren
    const filteredUsers = users.users
      .filter(user => userIds.includes(user.id))
      .map(user => ({
        id: user.id,
        email: user.email,
        name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
        created_at: user.created_at
      }));

    return res.status(200).json({ users: filteredUsers });
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer nach Tag:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  } finally {
    await prisma.$disconnect();
  }
}
