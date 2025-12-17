#!/usr/bin/env node

/**
 * Verbessertes Skript zum Kopieren statischer Dateien für den Next.js Standalone-Modus
 * 
 * Dieses Skript:
 * 1. Kopiert alle Dateien aus dem public-Ordner in den .next/standalone/public-Ordner
 * 2. Kopiert alle JavaScript-Build-Dateien aus .next/static in .next/standalone/.next/static
 * 3. Kopiert wichtige Manifest-Dateien
 */

const fs = require('fs');
const path = require('path');

// Pfade definieren
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const nextDir = path.join(rootDir, '.next');
const standaloneDir = path.join(nextDir, 'standalone');
const standalonePublicDir = path.join(standaloneDir, 'public');
const standaloneNextDir = path.join(standaloneDir, '.next');
const standaloneStaticDir = path.join(standaloneNextDir, 'static');
const nextStaticDir = path.join(nextDir, 'static');

// Funktion zum rekursiven Kopieren von Dateien und Verzeichnissen
function copyRecursive(src, dest) {
  // Verzeichnis erstellen, falls es nicht existiert
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Alle Dateien und Verzeichnisse im Quellverzeichnis lesen
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Rekursiv für Unterverzeichnisse aufrufen
      copyRecursive(srcPath, destPath);
    } else {
      // Datei kopieren
      fs.copyFileSync(srcPath, destPath);
      console.log(`Kopiert: ${srcPath} -> ${destPath}`);
    }
  }
}

// 1. Statische Dateien aus public kopieren
console.log('Kopiere statische Dateien aus public...');
copyRecursive(publicDir, standalonePublicDir);

// 2. JavaScript-Build-Dateien kopieren
console.log('Kopiere JavaScript-Build-Dateien...');
if (fs.existsSync(nextStaticDir)) {
  copyRecursive(nextStaticDir, standaloneStaticDir);
} else {
  console.warn('Warnung: .next/static existiert nicht');
}

// 3. Wichtige Manifest-Dateien kopieren
console.log('Kopiere wichtige Manifest-Dateien...');

// Sicherstellen, dass die Zielverzeichnisse existieren
if (!fs.existsSync(standaloneNextDir)) {
  fs.mkdirSync(standaloneNextDir, { recursive: true });
}

// Manifest-Dateien im Root-Verzeichnis kopieren
const manifestFiles = [
  '_buildManifest.js',
  '_ssgManifest.js',
  'build-manifest.json',
  'react-loadable-manifest.json'
];

manifestFiles.forEach(file => {
  const srcFile = path.join(nextDir, file);
  const destFile = path.join(standaloneNextDir, file);
  
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, destFile);
    console.log(`Kopiert: ${srcFile} -> ${destFile}`);
  } else {
    console.warn(`Warnung: ${srcFile} existiert nicht`);
  }
});

console.log('Statische Dateien wurden erfolgreich kopiert!');
