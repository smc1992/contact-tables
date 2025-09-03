const fetch = require('node-fetch');

async function testTagsAPI() {
  try {
    console.log('Teste GET /api/admin/tags...');
    const response = await fetch('http://localhost:3000/api/admin/tags');
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Daten:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('Fehler:', errorText);
    }
  } catch (error) {
    console.error('Fehler beim API-Aufruf:', error);
  }
}

testTagsAPI();
