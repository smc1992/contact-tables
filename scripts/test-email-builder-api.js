// Test-Skript für die E-Mail-Builder-API
require('dotenv').config();
const axios = require('axios');

async function testEmailBuilderApi() {
  console.log('Teste E-Mail-Builder-API...');
  
  // Beispiel-Empfänger
  const recipients = [
    {
      id: '123',
      email: 'test@example.com',
      name: 'Test User'
    }
  ];

  // Beispiel-Anfrage
  const requestBody = {
    subject: 'Test E-Mail vom API-Test-Skript',
    content: '<p>Dies ist eine Test-E-Mail, die über die API gesendet wurde.</p>',
    recipients: recipients
  };

  try {
    // Hole Auth-Token für Admin-Benutzer
    console.log('Hole Auth-Token...');
    const authResponse = await axios({
      method: 'POST',
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      data: {
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'password'
      }
    });

    const authData = authResponse.data;
    const accessToken = authData.access_token;

    if (!accessToken) {
      throw new Error('Kein Access-Token erhalten');
    }

    console.log('Auth-Token erhalten:', accessToken.substring(0, 10) + '...');

    // Sende E-Mail über die API
    console.log('Sende E-Mail über API...');
    const apiUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';
    const response = await axios({
      method: 'POST',
      url: `${apiUrl}/api/admin/emails/send`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: requestBody
    });

    const responseData = response.data;
    
    console.log('API-Antwort Status:', response.status);
    console.log('API-Antwort:', responseData);

    if (response.status >= 400) {
      throw new Error(`API-Fehler: ${responseData.message || 'Unbekannter Fehler'}`);
    }

    console.log('E-Mail erfolgreich gesendet!');
    return responseData;
  } catch (error) {
    console.error('Fehler beim Testen der E-Mail-Builder-API:', error);
    throw error;
  }
}

// Führe den Test aus
testEmailBuilderApi()
  .then(result => {
    console.log('Test abgeschlossen:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Test fehlgeschlagen:', error);
    process.exit(1);
  });
