const fs = require('fs');
const path = require('path');

// Fix reservations.tsx
const reservationsPath = path.join(__dirname, 'src/pages/restaurant/dashboard/reservations.tsx');
let content = fs.readFileSync(reservationsPath, 'utf8');

// Suche nach dem problematischen Bereich und füge ein Fragment hinzu
const fragment = content.match(/\}\)\s*\}\s*<div className="text-center py-12/);

if (fragment) {
  // Ersetze den problematischen Bereich mit einem Fragment
  content = content.replace(
    /\}\)\s*\}\s*<div className="text-center py-12/,
    '})}\n            {/* Leere Reservierungen */}\n            <div className="text-center py-12'
  );
  
  // Alternativ: Umschließe die beiden JSX-Elemente mit einem Fragment
  content = content.replace(
    /\}\)\s*\}\s*\{!loading && reservations\.length === 0 && \(/,
    '})}\n            {/* Wrapper für JSX-Elemente */}\n            {!loading && reservations.length === 0 && ('
  );
}

fs.writeFileSync(reservationsPath, content);
console.log('Reservations-Datei korrigiert');
