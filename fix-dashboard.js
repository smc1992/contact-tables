const fs = require('fs');

// Dashboard-Datei korrigieren
const dashboardPath = '/Users/smc/Desktop/contact-tables/src/pages/customer/dashboard.tsx';
let content = fs.readFileSync(dashboardPath, 'utf8');

// Problematischen Bereich identifizieren
const problemLine = content.match(/\s*{upcomingTables\.length > 0 && \(/);

if (problemLine) {
  // Ersetze die problematische Zeile und füge ein Fragment hinzu
  content = content.replace(
    /\s*{upcomingTables\.length > 0 && \(/g,
    '\n                      {/* Paginierung */}\n                      {upcomingTables && upcomingTables.length > 0 ? ('
  );
  
  // Finde die schließende Klammer und ersetze sie mit einem Fragment-Ende
  const closingPattern = /\s*\)\s*\}\s*\}/;
  content = content.replace(closingPattern, '\n                      ) : null}\n');
  
  fs.writeFileSync(dashboardPath, content);
  console.log('Dashboard-Datei korrigiert');
} else {
  console.error('Problematischer Bereich nicht gefunden');
}
