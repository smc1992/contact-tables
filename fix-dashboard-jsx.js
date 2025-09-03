const fs = require('fs');
const path = require('path');

// Pfad zur Dashboard-Datei
const dashboardPath = path.join(__dirname, 'src', 'pages', 'customer', 'dashboard.tsx');

// Datei einlesen
let content = fs.readFileSync(dashboardPath, 'utf8');

// Backup erstellen
fs.writeFileSync(`${dashboardPath}.backup2`, content, 'utf8');
console.log('Backup erstellt unter:', `${dashboardPath}.backup2`);

// Die gesamte return-Struktur extrahieren
const returnRegex = /return \(\s*<div className="min-h-screen flex flex-col">[\s\S]*?\);/;
const returnMatch = content.match(returnRegex);

if (returnMatch) {
  // Die ursprüngliche return-Struktur
  const originalReturn = returnMatch[0];
  
  // Korrigierte return-Struktur
  const correctedReturn = `return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex">
        <CustomerSidebar activePage="dashboard" />
        <main className="flex-grow bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Mein Dashboard</h1>
                    <Link href="/contact-tables">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FiStar className="mr-2" />
                        Neue Kontakttische entdecken
                      </button>
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Statistik-Karten */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                            <FiCalendar className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Anstehende Kontakttische</dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">{upcomingTotalCount}</div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                    
                  {/* Anstehende Kontakttische */}
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Anstehende Kontakttische</h2>
                    
                    {contactTablesLoading ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        </div>
                      </div>
                    ) : upcomingTables.length === 0 ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                        <div className="text-center text-gray-500">
                          <p>Keine anstehenden Kontakttische gefunden.</p>
                          <p className="mt-2">Melde dich für Kontakttische an, um sie hier zu sehen.</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {upcomingTables.map((table) => {
                              const { date, start_time } = formatDateTime(table.datetime || new Date().toISOString());
                              return (
                                <li key={table.id}>
                                  <Link href={\`/contact-tables/\${table.id}\`} className="block hover:bg-gray-50">
                                    <div className="px-4 py-4 sm:px-6">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-indigo-600 truncate">
                                          {table.title}
                                        </p>
                                        <div className="ml-2 flex-shrink-0 flex">
                                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {table.participants?.length || 0}/{table.max_participants} Teilnehmer
                                          </p>
                                        </div>
                                      </div>
                                      <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                          <p className="flex items-center text-sm text-gray-500">
                                            <FiMapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                            {table.restaurant?.name || 'Unbekanntes Restaurant'}
                                          </p>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                          <FiClock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                          <p>
                                            {date} um {start_time}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        
                        {upcomingTables.length > 0 && (
                          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                              <button
                                onClick={goToPreviousUpcomingPage}
                                disabled={upcomingCurrentPage === 1}
                                className={\`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md \${upcomingCurrentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}\`}
                              >
                                Zurück
                              </button>
                              <button
                                onClick={goToNextUpcomingPage}
                                disabled={upcomingCurrentPage === upcomingTotalPages}
                                className={\`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md \${upcomingCurrentPage === upcomingTotalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}\`}
                              >
                                Weiter
                              </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm text-gray-700">
                                  Zeige <span className="font-medium">{upcomingTables.length > 0 ? (upcomingCurrentPage - 1) * upcomingItemsPerPage + 1 : 0}</span> bis <span className="font-medium">{Math.min(upcomingCurrentPage * upcomingItemsPerPage, upcomingTotalCount)}</span> von <span className="font-medium">{upcomingTotalCount}</span> Kontakttischen
                                </p>
                              </div>
                              <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                  <button
                                    onClick={goToPreviousUpcomingPage}
                                    disabled={upcomingCurrentPage === 1}
                                    className={\`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 \${upcomingCurrentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}\`}
                                  >
                                    <span className="sr-only">Zurück</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  
                                  {/* Seitenzahlen */}
                                  {Array.from({ length: upcomingTotalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                      key={\`upcoming-page-\${page}\`}
                                      onClick={() => goToUpcomingPage(page)}
                                      className={\`relative inline-flex items-center px-4 py-2 border border-gray-300 \${page === upcomingCurrentPage ? 'bg-indigo-50 text-indigo-600 font-medium' : 'bg-white text-gray-500 hover:bg-gray-50'}\`}
                                    >
                                      {page}
                                    </button>
                                  ))}
                                  
                                  <button
                                    onClick={goToNextUpcomingPage}
                                    disabled={upcomingCurrentPage === upcomingTotalPages}
                                    className={\`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 \${upcomingCurrentPage === upcomingTotalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}\`}
                                  >
                                    <span className="sr-only">Weiter</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </nav>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Favorisierte Kontakttische */}
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Favorisierte Kontakttische</h2>
                    
                    {contactTablesLoading ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        </div>
                      </div>
                    ) : favoriteTables.length === 0 ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                        <div className="text-center text-gray-500">
                          <p>Keine favorisierten Kontakttische gefunden.</p>
                          <p className="mt-2">Füge Kontakttische zu deinen Favoriten hinzu, um sie hier zu sehen.</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {favoriteTables.map((table) => {
                              const { date, start_time } = formatDateTime(table.datetime || new Date().toISOString());
                              return (
                                <li key={table.id}>
                                  <Link href={\`/contact-tables/\${table.id}\`} className="block hover:bg-gray-50">
                                    <div className="px-4 py-4 sm:px-6">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-indigo-600 truncate">
                                          {table.title}
                                        </p>
                                        <div className="ml-2 flex-shrink-0 flex">
                                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {table.participants?.length || 0}/{table.max_participants} Teilnehmer
                                          </p>
                                        </div>
                                      </div>
                                      <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                          <p className="flex items-center text-sm text-gray-500">
                                            <FiMapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                            {table.restaurant?.name || 'Unbekanntes Restaurant'}
                                          </p>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                          <FiClock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                          <p>
                                            {date} um {start_time}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        
                        {favoriteTables.length > 0 && (
                          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                              <button
                                onClick={goToPreviousFavoritePage}
                                disabled={favoriteCurrentPage === 1}
                                className={\`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md \${favoriteCurrentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}\`}
                              >
                                Zurück
                              </button>
                              <button
                                onClick={goToNextFavoritePage}
                                disabled={favoriteCurrentPage === favoriteTotalPages}
                                className={\`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md \${favoriteCurrentPage === favoriteTotalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}\`}
                              >
                                Weiter
                              </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm text-gray-700">
                                  Zeige <span className="font-medium">{favoriteTables.length > 0 ? (favoriteCurrentPage - 1) * favoriteItemsPerPage + 1 : 0}</span> bis <span className="font-medium">{Math.min(favoriteCurrentPage * favoriteItemsPerPage, favoriteTotalCount)}</span> von <span className="font-medium">{favoriteTotalCount}</span> Kontakttischen
                                </p>
                              </div>
                              <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                  <button
                                    onClick={goToPreviousFavoritePage}
                                    disabled={favoriteCurrentPage === 1}
                                    className={\`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 \${favoriteCurrentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}\`}
                                  >
                                    <span className="sr-only">Zurück</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  
                                  {/* Seitenzahlen */}
                                  {Array.from({ length: favoriteTotalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                      key={\`favorite-page-\${page}\`}
                                      onClick={() => goToFavoritePage(page)}
                                      className={\`relative inline-flex items-center px-4 py-2 border border-gray-300 \${page === favoriteCurrentPage ? 'bg-indigo-50 text-indigo-600 font-medium' : 'bg-white text-gray-500 hover:bg-gray-50'}\`}
                                    >
                                      {page}
                                    </button>
                                  ))}
                                  
                                  <button
                                    onClick={goToNextFavoritePage}
                                    disabled={favoriteCurrentPage === favoriteTotalPages}
                                    className={\`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 \${favoriteCurrentPage === favoriteTotalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}\`}
                                  >
                                    <span className="sr-only">Weiter</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </nav>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Button zum Anzeigen aller Kontakttische */}
                  <div className="mt-8 flex justify-center">
                    <Link href="/contact-tables">
                      <button
                        type="button"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Alle Kontakttische anzeigen
                      </button>
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );`;
  
  // Die Datei mit der korrigierten return-Struktur aktualisieren
  content = content.replace(returnRegex, correctedReturn);
  
  // Datei speichern
  fs.writeFileSync(dashboardPath, content, 'utf8');
  console.log('Dashboard-Datei wurde vollständig korrigiert.');
} else {
  console.error('Die return-Struktur konnte nicht gefunden werden.');
}
