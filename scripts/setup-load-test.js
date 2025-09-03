/**
 * Setup-Skript für API-Lasttests
 * 
 * Dieses Skript erstellt die notwendige Verzeichnisstruktur und Konfigurationsdateien
 * für die API-Lasttests.
 */

const fs = require('fs');
const path = require('path');

// Konfiguration
const config = {
  reportsDir: path.join(__dirname, '../reports'),
  envFile: path.join(__dirname, '../.env.load-test')
};

/**
 * Erstellt die Verzeichnisstruktur für die Lasttests
 */
function createDirectoryStructure() {
  console.log('Erstelle Verzeichnisstruktur für Lasttests...');
  
  // Erstelle das Berichtsverzeichnis, falls es nicht existiert
  if (!fs.existsSync(config.reportsDir)) {
    fs.mkdirSync(config.reportsDir, { recursive: true });
    console.log(`Verzeichnis erstellt: ${config.reportsDir}`);
  } else {
    console.log(`Verzeichnis existiert bereits: ${config.reportsDir}`);
  }
}

/**
 * Erstellt eine Beispiel-Umgebungsdatei für die Lasttests
 */
function createEnvFile() {
  console.log('Erstelle Beispiel-Umgebungsdatei für Lasttests...');
  
  if (!fs.existsSync(config.envFile)) {
    const envContent = `# Umgebungsvariablen für API-Lasttests
# Kopieren Sie diese Datei nach .env.load-test und passen Sie die Werte an

# API-Basis-URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Test-Benutzer für authentifizierte Anfragen
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword

# Lasttest-Konfiguration
LOAD_TEST_CONCURRENT_USERS=10
LOAD_TEST_REQUESTS_PER_USER=5
LOAD_TEST_DELAY_BETWEEN_REQUESTS=100
`;
    
    fs.writeFileSync(config.envFile, envContent);
    console.log(`Beispiel-Umgebungsdatei erstellt: ${config.envFile}`);
  } else {
    console.log(`Umgebungsdatei existiert bereits: ${config.envFile}`);
  }
}

/**
 * Erstellt eine README-Datei mit Anweisungen zur Verwendung der Lasttests
 */
function createReadme() {
  const readmePath = path.join(__dirname, '../reports/README.md');
  
  console.log('Erstelle README-Datei für Lasttests...');
  
  const readmeContent = `# API-Lasttest-Berichte

Dieses Verzeichnis enthält die Ergebnisse und Berichte der API-Lasttests für das Contact-Tables-Projekt.

## Verfügbare Skripte

- \`load-test.js\`: Einfacher Lasttest für API-Endpunkte
- \`api-load-test.js\`: Detaillierter Lasttest mit mehreren Szenarien und HTML-Bericht
- \`analyze-load-test.js\`: Analysiert die Ergebnisse und gibt Optimierungsempfehlungen

## Verwendung

### Einfacher Lasttest

\`\`\`bash
node scripts/load-test.js
\`\`\`

### Detaillierter Lasttest mit Szenarien

\`\`\`bash
node scripts/api-load-test.js
\`\`\`

### Analyse der Ergebnisse

\`\`\`bash
node scripts/analyze-load-test.js [Pfad zur Ergebnisdatei]
\`\`\`

Wenn kein Pfad angegeben wird, wird automatisch die neueste Ergebnisdatei verwendet.

## Konfiguration

Die Lasttests können über die Umgebungsvariablen in der Datei \`.env.load-test\` konfiguriert werden:

- \`NEXT_PUBLIC_BASE_URL\`: Die Basis-URL der zu testenden API
- \`TEST_USER_EMAIL\` und \`TEST_USER_PASSWORD\`: Anmeldedaten für authentifizierte Anfragen
- \`LOAD_TEST_CONCURRENT_USERS\`: Anzahl der gleichzeitigen Benutzer
- \`LOAD_TEST_REQUESTS_PER_USER\`: Anzahl der Anfragen pro Benutzer
- \`LOAD_TEST_DELAY_BETWEEN_REQUESTS\`: Verzögerung zwischen Anfragen in ms

## Berichtsformate

- \`api-load-test-results-[Zeitstempel].json\`: Rohdaten der Lasttests
- \`api-load-test-report-[Zeitstempel].html\`: HTML-Bericht mit Diagrammen
- \`api-load-test-analysis-[Zeitstempel].md\`: Markdown-Bericht mit Analyse und Empfehlungen
`;
  
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`README-Datei erstellt: ${readmePath}`);
}

/**
 * Hauptfunktion
 */
function main() {
  console.log('=== Setup für API-Lasttests ===');
  
  // Erstelle die Verzeichnisstruktur
  createDirectoryStructure();
  
  // Erstelle die Beispiel-Umgebungsdatei
  createEnvFile();
  
  // Erstelle die README-Datei
  createReadme();
  
  console.log('\n=== Setup abgeschlossen ===');
  console.log('Sie können die Lasttests jetzt mit folgenden Befehlen ausführen:');
  console.log('- node scripts/load-test.js');
  console.log('- node scripts/api-load-test.js');
  console.log('- node scripts/analyze-load-test.js');
}

// Führe das Setup aus
main();
