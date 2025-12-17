import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '../../middleware/withAdminAuth';

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let prisma: PrismaClient | null = null;
  try {
    prisma = new PrismaClient();
    // Authentifizierung und Rollenprüfung bereits durch withAdminAuth durchgeführt
    const adminSupabase = createAdminClient();

    // Benutzer-IDs abrufen, die Tags haben
    const usersWithTags = await prisma.$queryRaw<Array<{userId: string}>>`
      SELECT DISTINCT "user_id" as "userId" FROM "user_tag_assignments"
    `;
    
    // Benutzer-IDs mit Tags extrahieren
    const userIdsWithTags = usersWithTags.map((assignment: { userId: string }) => assignment.userId);

    // Alle Benutzer über Admin-API paginiert abrufen, um keine zu verpassen
    const allUsers: any[] = [];
    try {
      let page = 1;
      const perPage = 1000;
      // loop with a safeguard of max 50 pages
      for (let i = 0; i < 50; i++) {
        const { data, error } = await adminSupabase.auth.admin.listUsers({ perPage, page });
        if (error) throw error;
        const batch = data?.users || [];
        allUsers.push(...batch);
        if (batch.length < perPage) break;
        page += 1;
      }
    } catch (e) {
      console.error('Fehler beim paginierten Abrufen der Benutzer:', e);
      return res.status(200).json({ users: [], error: 'Fehler beim Laden der Benutzerdaten' });
    }

    // Nur Benutzer ohne Tags filtern und formatieren
    const filteredUsers = allUsers
      .filter(user => !userIdsWithTags.includes(user.id))
      .map(user => ({
        id: user.id,
        email: user.email,
        name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
        created_at: user.created_at,
        role: user.user_metadata?.role || 'customer'
      }));

    return res.status(200).json({ users: filteredUsers });
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer ohne Tags:', error);
    return res.status(200).json({ users: [], error: 'Interner Serverfehler' });
  } finally {
    if (prisma) {
      await prisma.$disconnect().catch(() => {});
    }
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
