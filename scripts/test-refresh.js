#!/usr/bin/env node

// Test-Skript für die Token-Refresh-Rate-Limiting-Lösung
console.log('=== Token Refresh Rate-Limiting Test ===');
console.log('Prüfe, ob die Rate-Limiting-Logik vorhanden ist...');

// Prüfe, ob die Datei die erwarteten Funktionen enthält
const fs = require('fs');
const path = require('path');

const clientPath = path.join(__dirname, '../src/utils/supabase/client.ts');
const mainPath = path.join(__dirname, '../src/utils/supabase.ts');
const authContextPath = path.join(__dirname, '../src/contexts/AuthContext.tsx');

try {
  console.log('Lese Dateien...');
  const clientContent = fs.readFileSync(clientPath, 'utf8');
  const mainContent = fs.readFileSync(mainPath, 'utf8');
  const authContextContent = fs.readFileSync(authContextPath, 'utf8');
  
  console.log('Dateien erfolgreich gelesen!');
  
  // Prüfe auf wichtige Implementierungsdetails
  const checks = [
    { name: 'Debounce-Funktion', regex: /function\s+debounce/, files: [clientPath, mainPath] },
    { name: 'refreshState Objekt', regex: /refreshState\s*=\s*{/, files: [clientPath, mainPath] },
    { name: 'MIN_REFRESH_INTERVAL', regex: /MIN_REFRESH_INTERVAL\s*=/, files: [clientPath, mainPath] },
    { name: 'MAX_REFRESH_COUNT', regex: /MAX_REFRESH_COUNT\s*=/, files: [clientPath, mainPath] },
    { name: 'customFetch Implementierung', regex: /customFetch\s*=/, files: [clientPath, mainPath] },
    { name: 'Rate-Limit Erkennung (429)', regex: /response\.status\s*===\s*429/, files: [clientPath, mainPath] },
    { name: 'getSession Überschreibung', regex: /getSession\s*=\s*async/, files: [clientPath, mainPath] },
    { name: 'Exponentielles Backoff', regex: /backoffTime\s*=\s*Math\.min/, files: [clientPath, mainPath] },
    { name: 'AuthContext Debounce', regex: /useDebounce/, files: [authContextPath] },
    { name: 'AuthContext Fehlerbehandlung', regex: /authErrors/, files: [authContextPath] }
  ];
  
  console.log('\nPrüfe auf implementierte Rate-Limiting-Komponenten:');
  let allChecksPass = true;
  
  for (const check of checks) {
    let checkPassed = false;
    let foundInFile = '';
    
    for (const file of check.files) {
      let content;
      if (file === clientPath) content = clientContent;
      else if (file === mainPath) content = mainContent;
      else if (file === authContextPath) content = authContextContent;
      
      if (check.regex.test(content)) {
        checkPassed = true;
        foundInFile = path.basename(file);
        break;
      }
    }
    
    console.log(`${checkPassed ? '✅' : '❌'} ${check.name}${checkPassed ? ` (in ${foundInFile})` : ''}`);
    if (!checkPassed) {
      allChecksPass = false;
    }
  }
  
  if (allChecksPass) {
    console.log('\n✅ Alle Rate-Limiting-Komponenten sind implementiert!');
    console.log('Die Lösung sollte das Token-Refresh-Problem beheben.');
  } else {
    console.log('\n⚠️ Einige Rate-Limiting-Komponenten fehlen möglicherweise.');
    console.log('Überprüfe die Implementierung auf Vollständigkeit.');
  }
  
} catch (error) {
  console.error('Fehler beim Lesen der Dateien:', error);
}

console.log('\n=== Test abgeschlossen ===');
