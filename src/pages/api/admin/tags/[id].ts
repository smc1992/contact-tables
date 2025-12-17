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

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Ungültige Tag-ID' });
  }

  try {
    // GET: Tag-Details abrufen
    if (req.method === 'GET') {
      const tag = await prisma.userTag.findUnique({
        where: { id },
        include: {
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            }
          },
          _count: {
            select: { assignments: true }
          }
        }
      });
      
      if (!tag) {
        return res.status(404).json({ error: 'Tag nicht gefunden' });
      }
      
      return res.status(200).json({
        ...tag,
        userCount: tag._count.assignments,
        users: tag.assignments.map(assignment => assignment.user)
      });
    }
    
    // PUT: Tag aktualisieren
    else if (req.method === 'PUT') {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name ist erforderlich' });
      }
      
      // Prüfen, ob ein anderer Tag mit diesem Namen existiert
      const existingTag = await prisma.userTag.findFirst({
        where: {
          name,
          id: { not: id }
        }
      });
      
      if (existingTag) {
        return res.status(409).json({ error: 'Ein anderer Tag mit diesem Namen existiert bereits' });
      }
      
      const updatedTag = await prisma.userTag.update({
        where: { id },
        data: { name, description }
      });
      
      return res.status(200).json(updatedTag);
    }
    
    // DELETE: Tag löschen
    else if (req.method === 'DELETE') {
      await prisma.userTag.delete({
        where: { id }
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
