const fs = require('fs');

// Direkte Bearbeitung der reservations.tsx Datei
const filePath = '/Users/smc/Desktop/contact-tables/src/pages/restaurant/dashboard/reservations.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Suche nach dem problematischen Bereich
const startIndex = content.indexOf('            )}');
const endIndex = content.indexOf('{!loading && reservations.length === 0 && (', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  // Füge ein Fragment zwischen den beiden JSX-Elementen ein
  const before = content.substring(0, startIndex + 13); // +13 für die Länge von '            )}'
  const after = content.substring(endIndex);
  
  // Erstelle den neuen Inhalt mit einem Fragment
  const newContent = before + '\n            {/* JSX-Fragment als Trenner */}\n            ' + after;
  
  // Schreibe den neuen Inhalt in die Datei
  fs.writeFileSync(filePath, newContent);
  console.log('Reservations-Datei erfolgreich korrigiert');
} else {
  console.error('Problematischer Bereich nicht gefunden');
}
