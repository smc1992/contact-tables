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
    // GET: Alle Tags abrufen
    if (req.method === 'GET') {
      const tags = await prisma.userTag.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { assignments: true }
          }
        }
      });
      
      return res.status(200).json({ tags: tags.map(tag => ({
        ...tag,
        userCount: tag._count.assignments
      })) });
    }
    
    // POST: Neuen Tag erstellen
    else if (req.method === 'POST') {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name ist erforderlich' });
      }
      
      // Prüfen, ob Tag bereits existiert
      const existingTag = await prisma.userTag.findUnique({
        where: { name }
      });
      
      if (existingTag) {
        return res.status(409).json({ error: 'Tag existiert bereits' });
      }
      
      const newTag = await prisma.userTag.create({
        data: {
          name,
          description
        }
      });
      
      return res.status(201).json(newTag);
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
