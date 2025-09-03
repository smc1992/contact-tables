// Debugging-Skript für die Frontend-Filterung
console.log('Debugging Tag-Filterung');

// 1. Überprüfen, ob der Tag in der Datenbank existiert
const checkTag = async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Tag abrufen
    const tag = await prisma.userTag.findFirst({
      where: { name: 'willkomensmail' }
    });
    
    console.log('Tag in der Datenbank:', tag);
    
    // Zuweisungen prüfen
    if (tag) {
      const assignments = await prisma.userTagAssignment.findMany({
        where: { tagId: tag.id }
      });
      
      console.log(`Anzahl der Zuweisungen für Tag ${tag.name}: ${assignments.length}`);
      console.log('Zugewiesene Benutzer-IDs:', assignments.map(a => a.userId));
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Fehler beim Überprüfen des Tags:', error);
  }
};

// Ausführen
checkTag();
