const axios = require('axios');

// Konfiguration
const API_BASE_URL = 'http://localhost:3000/api';
const ENDPOINTS = [
  '/restaurants',
  '/categories',
  '/featured-restaurants',
  '/search?query=restaurant'
];
const REQUESTS_PER_ENDPOINT = 120; // Mehr als das Limit für die meisten Endpunkte
const DELAY_MS = 10; // Kurze Verzögerung zwischen Anfragen

// Funktion zum Senden einer Anfrage und Protokollieren der Antwort
async function makeRequest(endpoint, index) {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${API_BASE_URL}${endpoint}`);
    const endTime = Date.now();
    
    console.log(`[${index}] ${endpoint} - Status: ${response.status}, Zeit: ${endTime - startTime}ms`);
    
    // Protokolliere Rate-Limit-Header, wenn vorhanden
    const rateLimitLimit = response.headers['x-ratelimit-limit'];
    const rateLimitRemaining = response.headers['x-ratelimit-remaining'];
    const rateLimitReset = response.headers['x-ratelimit-reset'];
    
    if (rateLimitLimit) {
      console.log(`  Rate-Limit: ${rateLimitRemaining}/${rateLimitLimit}, Reset in ${rateLimitReset}s`);
    }
    
    return { success: true, status: response.status, headers: response.headers };
  } catch (error) {
    const status = error.response ? error.response.status : 'Keine Antwort';
    console.error(`[${index}] ${endpoint} - FEHLER: Status ${status}`);
    
    // Protokolliere Rate-Limit-Header bei 429-Fehlern
    if (error.response && error.response.status === 429) {
      const headers = error.response.headers;
      console.error(`  Rate-Limit überschritten! Reset in ${headers['x-ratelimit-reset'] || 'unbekannt'}s`);
    }
    
    return { 
      success: false, 
      status: status,
      headers: error.response ? error.response.headers : {}
    };
  }
}

// Funktion zum Testen eines Endpunkts
async function testEndpoint(endpoint) {
  console.log(`\n=== Teste ${endpoint} ===`);
  console.log(`Sende ${REQUESTS_PER_ENDPOINT} Anfragen...`);
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < REQUESTS_PER_ENDPOINT; i++) {
    results.push(await makeRequest(endpoint, i + 1));
    
    // Kurze Verzögerung zwischen Anfragen
    if (i < REQUESTS_PER_ENDPOINT - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 1000;
  
  // Analysiere Ergebnisse
  const successful = results.filter(r => r.success).length;
  const rateLimited = results.filter(r => r.status === 429).length;
  
  console.log(`\nErgebnisse für ${endpoint}:`);
  console.log(`  Gesamtzeit: ${totalTime.toFixed(2)}s`);
  console.log(`  Erfolgreiche Anfragen: ${successful}`);
  console.log(`  Rate-Limited Anfragen: ${rateLimited}`);
  console.log(`  Erfolgsrate: ${(successful / REQUESTS_PER_ENDPOINT * 100).toFixed(2)}%`);
  
  return {
    endpoint,
    totalTime,
    successful,
    rateLimited,
    successRate: successful / REQUESTS_PER_ENDPOINT
  };
}

// Hauptfunktion zum Testen aller Endpunkte
async function runTests() {
  console.log('=== Rate-Limiting-Test ===');
  console.log(`Teste ${ENDPOINTS.length} API-Endpunkte mit jeweils ${REQUESTS_PER_ENDPOINT} Anfragen\n`);
  
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    results.push(await testEndpoint(endpoint));
    
    // Pause zwischen Endpunkten, um Rate-Limits zurückzusetzen
    if (endpoint !== ENDPOINTS[ENDPOINTS.length - 1]) {
      console.log('\nWarte 5 Sekunden vor dem nächsten Test...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log('\n=== Zusammenfassung ===');
  for (const result of results) {
    console.log(`${result.endpoint}: ${result.successful}/${REQUESTS_PER_ENDPOINT} erfolgreich, ${result.rateLimited} rate-limited`);
  }
}

// Führe die Tests aus
runTests().catch(console.error);
