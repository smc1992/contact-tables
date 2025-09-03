const fs = require('fs');

// 1. Dashboard-Datei korrigieren
try {
  const dashboardPath = '/Users/smc/Desktop/contact-tables/src/pages/customer/dashboard.tsx';
  let content = fs.readFileSync(dashboardPath, 'utf8');
  
  // Ersetze die problematische Zeile 500
  content = content.replace(
    /\s*{upcomingTables\.length > 0 && \(/g,
    '\n                      {/* Paginierung */}\n                      {upcomingTables && upcomingTables.length > 0 && ('
  );
  
  fs.writeFileSync(dashboardPath, content);
  console.log('Dashboard-Datei korrigiert');
} catch (error) {
  console.error('Fehler bei der Korrektur der Dashboard-Datei:', error);
}

// 2. Reservations-Datei korrigieren (falls noch nötig)
try {
  const reservationsPath = '/Users/smc/Desktop/contact-tables/src/pages/restaurant/dashboard/reservations.tsx';
  let content = fs.readFileSync(reservationsPath, 'utf8');
  
  // Stelle sicher, dass die Klammer nach dem loading-Block korrekt ist
  content = content.replace(
    /\s*{loading && \([^)]*\)\s*\}\s*\n\s*\n\s*{!loading/g,
    '\n            {loading && (\n              <div className="flex justify-center items-center py-8">\n                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>\n              </div>\n            )}\n\n            {!loading'
  );
  
  fs.writeFileSync(reservationsPath, content);
  console.log('Reservations-Datei korrigiert');
} catch (error) {
  console.error('Fehler bei der Korrektur der Reservations-Datei:', error);
}
