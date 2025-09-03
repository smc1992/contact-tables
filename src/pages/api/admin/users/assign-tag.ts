import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '../../middleware/withAdminAuth';

const prisma = new PrismaClient();

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentifizierung und Rollenprüfung bereits durch withAdminAuth durchgeführt
    const adminSupabase = createAdminClient();

    // Tag-ID und Benutzer-IDs aus dem Request-Body extrahieren
    const { tagId, userIds } = req.body;
    
    if (!tagId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Tag-ID und Benutzer-IDs sind erforderlich' });
    }

    console.log(`Weise Tag ${tagId} zu ${userIds.length} Benutzern zu`);

    // Prüfen, ob der Tag existiert
    try {
      const tagExists = await prisma.userTag.findUnique({
        where: { id: tagId }
      });

      if (!tagExists) {
        console.log(`Tag mit ID ${tagId} nicht gefunden`);
        return res.status(404).json({ error: 'Tag nicht gefunden' });
      }
      
      console.log(`Tag gefunden: ${tagExists.name}`);
    } catch (tagError) {
      console.error('Fehler beim Prüfen des Tags:', tagError);
      return res.status(500).json({ error: 'Fehler beim Prüfen des Tags' });
    }

    // Tag den Benutzern zuweisen
    const assignments = [];
    for (const userId of userIds) {
      try {
        const assignment = await prisma.userTagAssignment.create({
          data: {
            userId,
            tagId
          }
        });
        assignments.push(assignment);
      } catch (error: any) {
        // Ignorieren, wenn die Zuweisung bereits existiert (Unique Constraint)
        if (error.code === 'P2002') {
          console.log(`Benutzer ${userId} hat bereits den Tag ${tagId}`);
        } else {
          console.error(`Fehler beim Zuweisen des Tags an Benutzer ${userId}:`, error);
        }
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Tag erfolgreich ${assignments.length} Benutzern zugewiesen`,
      assignments
    });
  } catch (error) {
    console.error('Fehler beim Zuweisen des Tags:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  } finally {
    await prisma.$disconnect();
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
