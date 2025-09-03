const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Pfad zum API-Verzeichnis
const apiDir = path.join(__dirname, '../src/pages/api');

// Funktion zum Durchsuchen von Dateien in einem Verzeichnis rekursiv
async function findFiles(dir, pattern) {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  const result = [];

  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // Rekursiv in Unterverzeichnissen suchen
      const nestedFiles = await findFiles(filePath, pattern);
      result.push(...nestedFiles);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      // Dateiinhalt lesen und nach dem Muster suchen
      const content = await readFile(filePath, 'utf8');
      if (content.includes(pattern)) {
        result.push(filePath);
      }
    }
  }

  return result;
}

// Funktion zum Aktualisieren der Importe in einer Datei
async function updateImports(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    
    // Relativen Pfad zur Middleware berechnen
    const relativePath = path.relative(path.dirname(filePath), path.join(apiDir, 'middleware')).replace(/\\/g, '/');
    const importPath = relativePath ? `${relativePath}/withAdminAuth` : './middleware/withAdminAuth';
    
    // Import-Anweisung ersetzen
    const updatedContent = content.replace(
      /import\s+\{\s*withAdminAuth\s*\}\s+from\s+['"]@\/backend\/middleware\/withAdminAuth['"];?/g,
      `import { withAdminAuth } from '${importPath}';`
    );
    
    if (content !== updatedContent) {
      await writeFile(filePath, updatedContent, 'utf8');
      console.log(`✅ Aktualisiert: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️ Keine Änderungen: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Fehler bei ${filePath}:`, error);
    return false;
  }
}

// Hauptfunktion
async function main() {
  try {
    console.log('Suche nach Dateien mit withAdminAuth-Importen...');
    const files = await findFiles(apiDir, '@/backend/middleware/withAdminAuth');
    
    console.log(`${files.length} Dateien gefunden.`);
    
    let updatedCount = 0;
    for (const file of files) {
      const updated = await updateImports(file);
      if (updated) updatedCount++;
    }
    
    console.log(`\nZusammenfassung:`);
    console.log(`- ${files.length} Dateien durchsucht`);
    console.log(`- ${updatedCount} Dateien aktualisiert`);
    
  } catch (error) {
    console.error('Fehler:', error);
    process.exit(1);
  }
}

main();
