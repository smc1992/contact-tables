import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '../../middleware/withAdminAuth';

const prisma = new PrismaClient();

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API-Route /api/admin/users/get-user-tags aufgerufen');

    // Prüfen, ob die Tag-Tabellen existieren
    try {
      // Prüfe, ob die Tabelle user_tag_assignments existiert
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_tag_assignments'
        );
      `;
      
      const exists = Array.isArray(tableExists) && tableExists.length > 0 && tableExists[0].exists;
      
      if (!exists) {
        console.log('Tabelle user_tag_assignments existiert nicht');
        return res.status(200).json({ userTags: {} });
      }
    } catch (error) {
      console.error('Fehler beim Prüfen der Tabelle:', error);
      return res.status(200).json({ userTags: {} });
    }

    // Alle Tag-Zuweisungen abrufen
    const tagAssignments = await prisma.$queryRaw<Array<{userId: string, tagId: string}>>`
      SELECT "user_id" as "userId", "tag_id" as "tagId" 
      FROM "user_tag_assignments"
    `;

    console.log(`${tagAssignments.length} Tag-Zuweisungen gefunden`);

    // Gruppiere die Tags nach Benutzer-ID
    const userTags: Record<string, string[]> = {};
    
    tagAssignments.forEach(assignment => {
      if (!userTags[assignment.userId]) {
        userTags[assignment.userId] = [];
      }
      userTags[assignment.userId].push(assignment.tagId);
    });

    return res.status(200).json({ userTags });
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer-Tags:', error);
    return res.status(200).json({ userTags: {}, error: 'Fehler beim Laden der Benutzer-Tags' });
  } finally {
    await prisma.$disconnect();
  }
}

export default withAdminAuth(handler);
