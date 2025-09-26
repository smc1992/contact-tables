const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Funktion zum rekursiven Durchsuchen von Verzeichnissen
async function findFiles(dir, pattern) {
  const files = [];
  const entries = await readdir(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      const subFiles = await findFiles(fullPath, pattern);
      files.push(...subFiles);
    } else if (pattern.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Funktion zum Korrigieren der withAuth-Importe
async function fixAuthImports(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Prüfen, ob die Datei withAuth importiert
    if (content.includes('import withAuth from') || content.includes("import withAuth from")) {
      console.log(`Korrigiere Import in ${filePath}`);
      
      // Ersetze den Import
      let newContent = content.replace(
        /import withAuth from ['"]@\/utils\/withAuth['"];?/g,
        "import withAuthClient from '@/utils/withAuthClient';"
      );
      
      // Ersetze den Export
      newContent = newContent.replace(
        /export default withAuth\((.*?)\);/g,
        "export default withAuthClient($1);"
      );
      
      await writeFile(filePath, newContent, 'utf8');
      console.log(`✅ ${filePath} erfolgreich korrigiert`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Fehler beim Bearbeiten von ${filePath}:`, error);
    return false;
  }
}

// Hauptfunktion
async function main() {
  try {
    console.log('🔍 Suche nach Admin-Seiten...');
    const adminPages = await findFiles(path.join(__dirname, '../src/pages/admin'), /\.tsx$/);
    
    console.log(`📝 ${adminPages.length} Admin-Seiten gefunden`);
    
    let fixedCount = 0;
    for (const page of adminPages) {
      const fixed = await fixAuthImports(page);
      if (fixed) fixedCount++;
    }
    
    console.log(`\n✨ ${fixedCount} Dateien wurden korrigiert`);
    
  } catch (error) {
    console.error('❌ Fehler:', error);
    process.exit(1);
  }
}

main();
