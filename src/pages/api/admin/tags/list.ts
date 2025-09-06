import type { NextApiRequest, NextApiResponse } from 'next';
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
    console.log('Prüfe, ob user_tags Tabelle existiert...');
    
    // Prüfen, ob die Tabelle existiert
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_tags'
      );
    `;
    
    const exists = Array.isArray(tableExists) && tableExists.length > 0 && tableExists[0].exists;
    
    if (!exists) {
      console.log('user_tags Tabelle existiert nicht, erstelle sie...');
      // Tabelle existiert nicht, erstelle sie
      try {
        await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
      } catch (e) {
        console.warn('Konnte Extension pgcrypto nicht erstellen (evtl. bereits vorhanden oder keine Berechtigung):', e);
      }
      try {
        await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
      } catch (e) {
        console.warn('Konnte Extension uuid-ossp nicht erstellen (evtl. bereits vorhanden oder keine Berechtigung):', e);
      }
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS public.user_tags (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `;
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS public.user_tag_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          tag_id UUID NOT NULL REFERENCES public.user_tags(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          UNIQUE(user_id, tag_id)
        );
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS user_tag_assignments_user_id_idx ON public.user_tag_assignments(user_id);
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS user_tag_assignments_tag_id_idx ON public.user_tag_assignments(tag_id);
      `;
      
      console.log('Tag-Tabellen erfolgreich erstellt!');
      
      // Leere Liste zurückgeben, da die Tabelle gerade erst erstellt wurde
      return res.status(200).json({ tags: [] });
    }
    
    console.log('user_tags Tabelle existiert, hole Tags...');

    // Tags mit Anzahl der zugewiesenen Benutzer abrufen
    try {
      const tags = await prisma.$queryRaw<Array<{id: string, name: string, description: string | null, userCount: number}>>`
        SELECT 
          ut.id, 
          ut.name, 
          ut.description, 
          COUNT(uta.id) as "userCount" 
        FROM "user_tags" ut
        LEFT JOIN "user_tag_assignments" uta ON ut.id = uta.tag_id
        GROUP BY ut.id, ut.name, ut.description
        ORDER BY ut.name ASC
      `;
      
      console.log(`${tags.length} Tags gefunden`);
      return res.status(200).json({ tags });
    } catch (queryError) {
      console.error('Fehler bei der Tag-Abfrage:', queryError);
      
      // Versuche eine einfachere Abfrage ohne Join
      try {
        const simpleTags = await prisma.$queryRaw<Array<{id: string, name: string, description: string | null}>>`
          SELECT id, name, description FROM "user_tags" ORDER BY name ASC
        `;
        
        // Füge userCount manuell hinzu
        const tagsWithCount = simpleTags.map(tag => ({
          ...tag,
          userCount: 0
        }));
        
        console.log(`${tagsWithCount.length} Tags mit einfacher Abfrage gefunden`);
        return res.status(200).json({ tags: tagsWithCount });
      } catch (simpleQueryError) {
        console.error('Auch einfache Abfrage fehlgeschlagen:', simpleQueryError);
        return res.status(200).json({ tags: [], error: 'Fehler beim Abrufen der Tags' });
      }
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Tags:', error);
    return res.status(200).json({ tags: [], error: 'Interner Serverfehler' });
  } finally {
    if (prisma) {
      await prisma.$disconnect().catch(() => {});
    }
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
