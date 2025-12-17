// @ts-check
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starte Tag-Zuweisung...');
    
    // Tag ID abrufen
    const tag = await prisma.userTag.findUnique({
      where: { name: 'willkomensmail' }
    });
    
    if (!tag) {
      console.error('Tag "willkomensmail" nicht gefunden');
      return;
    }
    
    console.log(`Tag gefunden: ${tag.id}`);
    
    // Benutzer abrufen
    const users = await prisma.profile.findMany({
      take: 5
    });
    
    if (users.length === 0) {
      console.log('Keine Benutzer gefunden');
      return;
    }
    
    console.log(`${users.length} Benutzer gefunden`);
    
    // Ersten 3 Benutzern den Tag zuweisen
    const usersToAssign = users.slice(0, 3);
    
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
          console.log(`Benutzer ${user.id} hat bereits den Tag`);
          continue;
        }
        
        // Tag zuweisen
        await prisma.userTagAssignment.create({
          data: {
            userId: user.id,
            tagId: tag.id
          }
        });
        
        console.log(`Tag erfolgreich zugewiesen an Benutzer: ${user.id}`);
      } catch (error) {
        console.error(`Fehler beim Zuweisen des Tags an ${user.id}:`, error);
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
