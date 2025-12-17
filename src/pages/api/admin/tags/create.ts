import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '../../middleware/withAdminAuth';

const prisma = new PrismaClient();

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentifizierung und Rollenprüfung bereits durch withAdminAuth durchgeführt
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }

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
    }

    // Prüfen, ob der Tag bereits existiert
    const existingTag = await prisma.$queryRaw<Array<{id: string}>>`
      SELECT id FROM "user_tags" WHERE name = ${name}
    `;

    if (existingTag.length > 0) {
      return res.status(400).json({ error: 'Ein Tag mit diesem Namen existiert bereits' });
    }

    // Tag erstellen
    const newTag = await prisma.$queryRaw<Array<{id: string, name: string, description: string | null}>>`
      INSERT INTO "user_tags" (name, description)
      VALUES (${name}, ${description || null})
      RETURNING id, name, description
    `;

    console.log('Neuer Tag erstellt:', newTag[0]);

    return res.status(201).json({ tag: newTag[0] });
  } catch (error) {
    console.error('Fehler beim Erstellen des Tags:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  } finally {
    await prisma.$disconnect();
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
