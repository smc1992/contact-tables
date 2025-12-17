// Test-Skript für die Registrierungsfunktion
const fetch = require('node-fetch');

// Umgebungsvariablen für den Test
const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test123456!';
const TEST_NAME = 'Test User';
const TEST_ROLE = 'customer';

async function testRegistration() {
  console.log('=== Registrierungstest ===');
  console.log(`API URL: ${API_URL}`);
  console.log(`Test-E-Mail: ${TEST_EMAIL}`);
  
  try {
    console.log('\nSende Registrierungsanfrage...');
    const startTime = Date.now();
    
    const response = await fetch(`${API_URL}/api/auth/register-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
        role: TEST_ROLE,
      }),
    });
    
    const endTime = Date.now();
    const responseData = await response.json();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Dauer: ${endTime - startTime}ms`);
    
    if (response.ok) {
      console.log('Registrierung erfolgreich!');
      console.log('Antwortdaten:', JSON.stringify(responseData, null, 2));
    } else {
      console.error('Registrierung fehlgeschlagen!');
      console.error('Fehlerdetails:', JSON.stringify(responseData, null, 2));
    }
  } catch (error) {
    console.error('Unerwarteter Fehler:', error.message);
    if (error.stack) {
      console.error('Stack Trace:', error.stack);
    }
  }
  
  console.log('\n=== Test abgeschlossen ===');
}

// Test ausführen
testRegistration().catch(console.error);
