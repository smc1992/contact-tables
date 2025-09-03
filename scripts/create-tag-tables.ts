import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Erstelle Tag-Tabellen...');
    
    // Führe SQL direkt aus
    await prisma.$executeRaw`
      -- Erstellen der user_tags Tabelle
      CREATE TABLE IF NOT EXISTS public.user_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
    
    await prisma.$executeRaw`
      -- Erstellen der user_tag_assignments Tabelle
      CREATE TABLE IF NOT EXISTS public.user_tag_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES public.user_tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, tag_id)
      );
    `;
    
    await prisma.$executeRaw`
      -- Index für schnellere Abfragen
      CREATE INDEX IF NOT EXISTS user_tag_assignments_user_id_idx ON public.user_tag_assignments(user_id);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS user_tag_assignments_tag_id_idx ON public.user_tag_assignments(tag_id);
    `;
    
    console.log('Tag-Tabellen erfolgreich erstellt!');
  } catch (error) {
    console.error('Fehler beim Erstellen der Tag-Tabellen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
