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
      
      // Batch-Verarbeitung für große Mengen von Benutzern (z.B. 700+)
      if (newUserIds.length > 0) {
        const BATCH_SIZE = 50; // Kleinere Batch-Größe für bessere Stabilität
        
        try {
          // Verarbeitung in Batches, um Timeouts zu vermeiden
          for (let i = 0; i < newUserIds.length; i += BATCH_SIZE) {
            const batch = newUserIds.slice(i, i + BATCH_SIZE);
            console.log(`Verarbeite Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(newUserIds.length/BATCH_SIZE)} mit ${batch.length} Benutzern`);
            
            // Einzelne Einfügungen statt createMany für bessere Fehlerbehandlung
            for (const userId of batch) {
              try {
                await prisma.userTagAssignment.create({
                  data: {
                    userId,
                    tagId
                  }
                });
              } catch (err: any) {
                // Ignoriere Duplikatfehler, protokolliere andere
                if (!err.message?.includes('Unique constraint')) {
                  console.error(`Fehler bei Benutzer ${userId}:`, err);
                }
              }
            }
            
            // Kurze Pause zwischen Batches, um Datenbank-Überlastung zu vermeiden
            if (i + BATCH_SIZE < newUserIds.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          console.log(`Tag ${tagId} erfolgreich ${newUserIds.length} Benutzern in Batches zugewiesen`);
        } catch (batchError) {
          console.error('Fehler bei Batch-Verarbeitung:', batchError);
          throw batchError;
        }
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
