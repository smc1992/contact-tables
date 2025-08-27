import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authentifizierung prüfen
  const supabase = createClient({ req, res });
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }
  
  // Rollen-Berechtigung prüfen
  const userRole = user.user_metadata?.role?.toLowerCase();
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  try {
    // POST: Tags zu Benutzern zuweisen
    if (req.method === 'POST') {
      const { userIds, tagId } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'Benutzer-IDs sind erforderlich' });
      }
      
      if (!tagId) {
        return res.status(400).json({ error: 'Tag-ID ist erforderlich' });
      }
      
      // Prüfen, ob Tag existiert
      const tag = await prisma.userTag.findUnique({
        where: { id: tagId }
      });
      
      if (!tag) {
        return res.status(404).json({ error: 'Tag nicht gefunden' });
      }
      
      // Bestehende Zuweisungen für diese Benutzer und diesen Tag finden
      const existingAssignments = await prisma.userTagAssignment.findMany({
        where: {
          userId: { in: userIds },
          tagId: tagId
        }
      });
      
      // Nur neue Zuweisungen erstellen
      const existingUserIds = existingAssignments.map(a => a.userId);
      const newUserIds = userIds.filter(id => !existingUserIds.includes(id));
      
      if (newUserIds.length > 0) {
        await prisma.userTagAssignment.createMany({
          data: newUserIds.map(userId => ({
            userId,
            tagId
          })),
          skipDuplicates: true
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        assigned: newUserIds.length,
        alreadyAssigned: existingUserIds.length
      });
    }
    
    // DELETE: Tags von Benutzern entfernen
    else if (req.method === 'DELETE') {
      const { userIds, tagId } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'Benutzer-IDs sind erforderlich' });
      }
      
      if (!tagId) {
        return res.status(400).json({ error: 'Tag-ID ist erforderlich' });
      }
      
      await prisma.userTagAssignment.deleteMany({
        where: {
          userId: { in: userIds },
          tagId: tagId
        }
      });
      
      return res.status(200).json({ success: true });
    }
    
    else {
      return res.status(405).json({ error: 'Methode nicht erlaubt' });
    }
  } catch (error) {
    console.error('API-Fehler:', error);
    return res.status(500).json({ error: 'Serverfehler' });
  } finally {
    await prisma.$disconnect();
  }
}
