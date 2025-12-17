#!/usr/bin/env node

/**
 * Verbessertes Skript zum Starten des Next.js Standalone-Servers
 * Dieses Skript:
 * 1. Lädt Umgebungsvariablen aus .env
 * 2. Kopiert statische Dateien, falls nötig
 * 3. Startet den Standalone-Server mit den korrekten Einstellungen
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Pfade definieren
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const standaloneEnvPath = path.join(standaloneDir, '.env');
const publicDir = path.join(rootDir, 'public');
const standalonePublicDir = path.join(standaloneDir, 'public');
// In Next.js 14 ist die Datei möglicherweise anders benannt
let serverPath = path.join(standaloneDir, 'server.js');
if (!fs.existsSync(serverPath)) {
  // Suche nach der tatsächlichen Server-Datei
  const files = fs.readdirSync(standaloneDir);
  const serverFile = files.find(file => file.endsWith('.js') && file !== '.next.js');
  if (serverFile) {
    serverPath = path.join(standaloneDir, serverFile);
  }
}

// Umgebungsvariablen laden
console.log('Lade Umgebungsvariablen...');
dotenv.config({ path: envPath });

// Überprüfen, ob statische Dateien kopiert werden müssen
if (!fs.existsSync(standalonePublicDir) || fs.readdirSync(standalonePublicDir).length === 0) {
  console.log('Statische Dateien werden kopiert...');
  try {
    // Kopier-Skript ausführen
    require('./copy-static-files');
  } catch (error) {
    console.error('Fehler beim Kopieren der statischen Dateien:', error);
    process.exit(1);
  }
}

// Umgebungsvariablen für den Standalone-Server kopieren
console.log('Kopiere Umgebungsvariablen für den Standalone-Server...');
try {
  fs.copyFileSync(envPath, standaloneEnvPath);
} catch (error) {
  console.error('Fehler beim Kopieren der Umgebungsvariablen:', error);
  process.exit(1);
}

// Port für den Server festlegen
const PORT = process.env.PORT || 3000;

// Prüfen, ob der Port bereits verwendet wird
try {
  console.log(`Überprüfe, ob Port ${PORT} bereits verwendet wird...`);
  const portCheck = execSync(`lsof -i:${PORT} -t`).toString().trim();
  
  if (portCheck) {
    console.log(`Port ${PORT} wird bereits verwendet. Beende Prozess ${portCheck}...`);
    execSync(`kill -9 ${portCheck}`);
    console.log('Prozess beendet.');
  }
} catch (error) {
  // Kein Prozess verwendet diesen Port
  console.log(`Port ${PORT} ist frei.`);
}

// Server starten
console.log(`Starte Standalone-Server auf Port ${PORT}...`);
try {
  // Umgebungsvariablen für den Server setzen
  process.env.PORT = PORT;
  
  // Server-Modul importieren und ausführen
  console.log('Server wird gestartet...');
  require(serverPath);
} catch (error) {
  console.error('Fehler beim Starten des Servers:', error);
  process.exit(1);
}
