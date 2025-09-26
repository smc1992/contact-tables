// Skript zum Senden einer Bestätigungs-E-Mail an einen bestehenden Benutzer
const fetch = require('node-fetch');

async function sendConfirmationEmail(email) {
  try {
    console.log(`Sende Bestätigungs-E-Mail an: ${email}`);
    
    const response = await fetch('http://localhost:3000/api/auth/send-confirmation-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email,
        password: 'Temp1234!' // Temporäres Passwort für die Link-Generierung
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Fehler beim Senden der E-Mail:', result);
      return;
    }
    
    console.log('Erfolg:', result);
  } catch (error) {
    console.error('Fehler:', error);
  }
}

// E-Mail-Adresse als Kommandozeilenargument übergeben
const email = process.argv[2];

if (!email) {
  console.error('Bitte geben Sie eine E-Mail-Adresse an: node send-confirmation-email.js email@example.com');
  process.exit(1);
}

sendConfirmationEmail(email);
