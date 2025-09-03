import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '../../middleware/withAdminAuth';

const prisma = new PrismaClient();

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentifizierung und Rollenprüfung bereits durch withAdminAuth durchgeführt
    const adminSupabase = createAdminClient();

    // Benutzer-IDs abrufen, die Tags haben
    const usersWithTags = await prisma.$queryRaw<Array<{userId: string}>>`
      SELECT DISTINCT "user_id" as "userId" FROM "user_tag_assignments"
    `;
    
    // Benutzer-IDs mit Tags extrahieren
    const userIdsWithTags = usersWithTags.map((assignment: { userId: string }) => assignment.userId);

    // Benutzerinformationen aus Supabase abrufen mit Admin-Client
    const { data: users, error: usersError } = await adminSupabase.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }

    // Nur Benutzer ohne Tags filtern und formatieren
    const filteredUsers = users.users
      .filter(user => !userIdsWithTags.includes(user.id))
      .map(user => ({
        id: user.id,
        email: user.email,
        name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
        created_at: user.created_at
      }));

    return res.status(200).json({ users: filteredUsers });
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer ohne Tags:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  } finally {
    await prisma.$disconnect();
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
