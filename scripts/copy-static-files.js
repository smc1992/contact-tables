const fs = require('fs');
const path = require('path');

// Pfade definieren
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const standalonePublicDir = path.join(standaloneDir, 'public');

// Funktion zum rekursiven Kopieren von Verzeichnissen
function copyDirectory(source, destination) {
  // Erstelle das Zielverzeichnis, falls es nicht existiert
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Lese alle Dateien und Unterverzeichnisse
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Rekursiv für Unterverzeichnisse aufrufen
      copyDirectory(sourcePath, destPath);
    } else {
      // Datei kopieren
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Kopiert: ${sourcePath} -> ${destPath}`);
    }
  }
}

// Hauptfunktion
function main() {
  console.log('Kopiere statische Dateien für Standalone-Modus...');
  
  try {
    // Stelle sicher, dass das Zielverzeichnis existiert
    if (!fs.existsSync(standalonePublicDir)) {
      fs.mkdirSync(standalonePublicDir, { recursive: true });
    }

    // Kopiere den gesamten public-Ordner
    copyDirectory(publicDir, standalonePublicDir);
    
    console.log('Statische Dateien wurden erfolgreich kopiert!');
  } catch (error) {
    console.error('Fehler beim Kopieren der statischen Dateien:', error);
    process.exit(1);
  }
}

// Führe das Skript aus
main();
