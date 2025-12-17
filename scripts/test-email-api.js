// Test-Skript für die E-Mail-Versand-API
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testEmailApi() {
  console.log('=== Test der E-Mail-Versand-API ===');
  
  try {
    // Erstelle einen einfachen Test-Request
    const testData = {
      subject: 'Test-E-Mail von API',
      content: '<p>Dies ist eine Test-E-Mail von der API.</p>',
      recipients: [
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        }
      ]
    };
    
    // Rufe die API auf
    console.log('Rufe E-Mail-Versand-API auf...');
    const response = await fetch('http://localhost:3000/api/admin/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Füge hier einen gültigen Auth-Token hinzu, wenn nötig
      },
      body: JSON.stringify(testData)
    });
    
    // Verarbeite die Antwort
    const responseData = await response.json();
    console.log('API-Antwort Status:', response.status);
    console.log('API-Antwort Daten:', responseData);
    
    if (!response.ok) {
      console.error('Fehler beim Aufrufen der API:', responseData.message);
    }
    
  } catch (error) {
    console.error('Fehler beim Testen der E-Mail-Versand-API:', error);
  }
}

testEmailApi();
