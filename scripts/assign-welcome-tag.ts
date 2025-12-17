import { PrismaClient } from '@prisma/client';
import { createAdminClient } from '../src/utils/supabase/server';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starte Tag-Zuweisung...');
    
    // Admin Supabase Client erstellen
    const adminSupabase = createAdminClient();
    
    // Benutzer abrufen
    const { data: users, error } = await adminSupabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Fehler beim Abrufen der Benutzer:', error);
      return;
    }
    
    if (!users || users.users.length === 0) {
      console.log('Keine Benutzer gefunden');
      return;
    }
    
    console.log(`${users.users.length} Benutzer gefunden`);
    
    // Tag ID abrufen
    const tag = await prisma.userTag.findUnique({
      where: { name: 'willkomensmail' }
    });
    
    if (!tag) {
      console.error('Tag "willkomensmail" nicht gefunden');
      return;
    }
    
    console.log(`Tag gefunden: ${tag.id}`);
    
    // Ersten 3 Benutzern den Tag zuweisen
    const usersToAssign = users.users.slice(0, 3);
    
    for (const user of usersToAssign) {
      try {
        // Prüfen, ob der Benutzer bereits den Tag hat
        const existingAssignment = await prisma.userTagAssignment.findFirst({
          where: {
            userId: user.id,
            tagId: tag.id
          }
        });
        
        if (existingAssignment) {
          console.log(`Benutzer ${user.email} hat bereits den Tag`);
          continue;
        }
        
        // Tag zuweisen
        await prisma.userTagAssignment.create({
          data: {
            userId: user.id,
            tagId: tag.id
          }
        });
        
        console.log(`Tag erfolgreich zugewiesen an: ${user.email}`);
      } catch (error) {
        console.error(`Fehler beim Zuweisen des Tags an ${user.email}:`, error);
      }
    }
    
    console.log('Tag-Zuweisung abgeschlossen');
  } catch (error) {
    console.error('Fehler bei der Tag-Zuweisung:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
