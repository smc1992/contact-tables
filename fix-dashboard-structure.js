const fs = require('fs');
const path = require('path');

// Pfad zur Dashboard-Datei
const dashboardPath = path.join(__dirname, 'src', 'pages', 'customer', 'dashboard.tsx');

// Datei einlesen
let content = fs.readFileSync(dashboardPath, 'utf8');

// Backup erstellen
fs.writeFileSync(`${dashboardPath}.backup`, content, 'utf8');
console.log('Backup erstellt unter:', `${dashboardPath}.backup`);

// JSX-Struktur korrigieren
// 1. Problem: Fehlende schließende Tags und falsche Verschachtelung

// Korrektur der Grid-Struktur und Verschachtelung
content = content.replace(
  /(<div className="grid grid-cols-1 md:grid-cols-3 gap-6">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>[\s\S]*?)(<div className="mt-8">[\s\S]*?<h2 className="text-xl font-semibold text-gray-900 mb-4">Favorisierte Kontakttische<\/h2>)/g,
  '$1</div>\n                  $2'
);

// Korrektur der schließenden Tags am Ende der Komponente
content = content.replace(
  /(<div className="mt-8 flex justify-center">[\s\S]*?<\/div>\s*<\/div>\s*)(\)\s*\}\s*<\/motion\.div>\s*<\/div>\s*<\/main>\s*<\/div>\s*<Footer \/>\s*<\/div>\s*\);)/g,
  '$1</>\n              $2'
);

// Datei speichern
fs.writeFileSync(dashboardPath, content, 'utf8');
console.log('Dashboard-Datei wurde korrigiert.');
