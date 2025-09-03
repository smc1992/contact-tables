const fs = require('fs');

// 1. Fix dashboard.tsx
const dashboardPath = '/Users/smc/Desktop/contact-tables/src/pages/customer/dashboard.tsx';
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// Entferne den problematischen Kommentar vollständig
dashboardContent = dashboardContent.replace(
  /\s*{\s*\/\*\s*Paginierung.*?\*\/\s*}/g,
  '\n                      {/* Paginierung entfernt */}'
);

fs.writeFileSync(dashboardPath, dashboardContent);
console.log('Dashboard-Datei korrigiert');

// 2. Fix reservations.tsx
const reservationsPath = '/Users/smc/Desktop/contact-tables/src/pages/restaurant/dashboard/reservations.tsx';
let reservationsContent = fs.readFileSync(reservationsPath, 'utf8');

// Finde die problematischen JSX-Elemente und umschließe sie mit einem Fragment
const startPattern = /\}\)\s*\}\s*\{!loading && reservations\.length === 0 && \(/;
const match = reservationsContent.match(startPattern);

if (match) {
  const startIndex = match.index;
  const endOfFirstJSX = startIndex + 2; // Ende des ersten JSX-Elements
  
  // Teile den String auf
  const beforeFirstJSX = reservationsContent.substring(0, endOfFirstJSX);
  const afterFirstJSX = reservationsContent.substring(endOfFirstJSX);
  
  // Füge ein Fragment ein
  const newContent = beforeFirstJSX + '\n            <>\n' + afterFirstJSX;
  
  // Füge das schließende Fragment-Tag am Ende hinzu
  const endOfSecondJSX = newContent.indexOf('</div>', newContent.indexOf('Erstellen Sie Contact Tables'));
  if (endOfSecondJSX !== -1) {
    const endIndex = endOfSecondJSX + 6; // Ende des zweiten JSX-Elements
    const beforeEnd = newContent.substring(0, endIndex);
    const afterEnd = newContent.substring(endIndex);
    
    const finalContent = beforeEnd + '\n            </>\n' + afterEnd;
    fs.writeFileSync(reservationsPath, finalContent);
    console.log('Reservations-Datei korrigiert');
  } else {
    console.error('Ende des zweiten JSX-Elements nicht gefunden');
  }
} else {
  console.error('Problematischer Bereich nicht gefunden');
}
