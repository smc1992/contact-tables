import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';
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

    // Tag-ID aus der Anfrage extrahieren
    const { tagId } = req.query;
    
    if (!tagId || typeof tagId !== 'string') {
      return res.status(400).json({ error: 'Tag-ID ist erforderlich' });
    }

    console.log(`Suche Benutzer mit Tag ID: ${tagId}`);

    // Prüfen, ob der Tag existiert
    try {
      const tagExists = await prisma.userTag.findUnique({
        where: { id: tagId }
      });

      if (!tagExists) {
        console.log(`Tag mit ID ${tagId} nicht gefunden`);
        return res.status(200).json({ users: [], message: 'Tag nicht gefunden' });
      }
      
      console.log(`Tag gefunden: ${tagExists.name}`);
    } catch (tagError) {
      console.error('Fehler beim Prüfen des Tags:', tagError);
      // Wir setzen fort, auch wenn die Tag-Prüfung fehlschlägt
    }

    // Benutzer mit dem angegebenen Tag abrufen
    let userIds: string[] = [];
    try {
      const usersWithTag = await prisma.$queryRaw<Array<{userId: string}>>`
        SELECT "user_id" as "userId" FROM "user_tag_assignments"
        WHERE "tag_id" = ${tagId}
      `;
      
      console.log(`Gefundene Zuweisungen: ${usersWithTag.length}`);
      
      // Benutzer-IDs extrahieren
      userIds = usersWithTag.map((assignment: { userId: string }) => assignment.userId);
      
      // Wenn keine Benutzer mit diesem Tag gefunden wurden, leere Liste zurückgeben
      if (userIds.length === 0) {
        return res.status(200).json({ users: [] });
      }
    } catch (assignmentError) {
      console.error('Fehler beim Abrufen der Tag-Zuweisungen:', assignmentError);
      return res.status(200).json({ users: [], error: 'Fehler beim Abrufen der Tag-Zuweisungen' });
    }

    // Benutzerinformationen gezielt per ID aus Supabase abrufen (vermeidet Pagination-Probleme)
    try {
      const users = await Promise.all(
        userIds.map(async (id) => {
          try {
            const { data, error } = await adminSupabase.auth.admin.getUserById(id);
            if (error || !data?.user) return null;
            const user = data.user;
            return {
              id: user.id,
              email: user.email,
              name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
              created_at: user.created_at,
              role: user.user_metadata?.role || 'customer'
            };
          } catch (e) {
            console.warn('Konnte Benutzer nicht laden:', id, e);
            return null;
          }
        })
      );

      const filteredUsers = users.filter(Boolean) as Array<{ id: string; email: string | null; name: string; created_at: string; role: string }>;
      console.log(`Gefilterte Benutzer zurückgegeben: ${filteredUsers.length}`);
      return res.status(200).json({ users: filteredUsers });
    } catch (supabaseError) {
      console.error('Fehler beim Abrufen der Benutzerdaten von Supabase:', supabaseError);
      return res.status(200).json({ users: [], error: 'Fehler beim Laden der Benutzerdaten' });
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer nach Tag:', error);
    return res.status(200).json({ users: [], error: 'Interner Serverfehler' });
  } finally {
    if (prisma) {
      await prisma.$disconnect().catch(() => {});
    }
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
