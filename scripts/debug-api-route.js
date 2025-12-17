// Debugging-Skript für die API-Route
const https = require('https');
const http = require('http');

// Hilfsfunktion für HTTP-Anfragen
async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            json: () => JSON.parse(data),
            ok: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testTagFilter() {
  try {
    // Tag-ID aus der Datenbank abrufen
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const tag = await prisma.userTag.findFirst({
      where: { name: 'willkomensmail' }
    });
    
    if (!tag) {
      console.error('Tag "willkomensmail" nicht gefunden');
      return;
    }
    
    console.log('Tag gefunden:', tag);
    
    // API-Route testen
    const response = await fetchUrl(`http://localhost:3000/api/admin/users/by-tag?tagId=${tag.id}`);
    const data = await response.json();
    
    console.log('API-Antwort:', JSON.stringify(data, null, 2));
    
    // Prüfen, ob die Benutzer korrekt zurückgegeben werden
    if (Array.isArray(data.users)) {
      console.log(`Anzahl der gefilterten Benutzer: ${data.users.length}`);
      console.log('Benutzer-IDs:', data.users.map(u => u.id));
    } else {
      console.error('Keine Benutzer in der Antwort gefunden oder ungültiges Format');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Fehler beim Testen der API-Route:', error);
  }
}

testTagFilter();
