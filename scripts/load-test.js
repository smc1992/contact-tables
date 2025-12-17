/**
 * Lasttest-Skript für API-Endpunkte
 * 
 * Dieses Skript führt Lasttests für verschiedene API-Endpunkte durch,
 * um deren Leistung und Stabilität unter Last zu überprüfen.
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
require('dotenv').config();

// Konfiguration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  concurrentUsers: 10, // Anzahl gleichzeitiger Benutzer
  requestsPerUser: 5,  // Anzahl der Anfragen pro Benutzer
  delayBetweenRequests: 100, // Verzögerung zwischen Anfragen in ms
  endpoints: [
    { path: '/api/restaurants', method: 'GET' },
    { path: '/api/categories', method: 'GET' },
    { path: '/api/featured-restaurants', method: 'GET' },
    { path: '/api/search?query=restaurant', method: 'GET' }
  ]
};

// Authentifizierungstoken (falls benötigt)
let authToken = null;

/**
 * Führt einen Login durch, um ein Auth-Token zu erhalten
 */
async function login() {
  try {
    console.log('Authentifizierung wird durchgeführt...');
    
    // Diese Anmeldedaten sollten nur für Testzwecke verwendet werden
    const response = await axios.post(`${config.baseUrl}/api/auth/login`, {
      email: process.env.TEST_USER_EMAIL,
      password: process.env.TEST_USER_PASSWORD
    });
    
    if (response.data && response.data.token) {
      authToken = response.data.token;
      console.log('Authentifizierung erfolgreich');
      return true;
    }
  } catch (error) {
    console.error('Authentifizierung fehlgeschlagen:', error.message);
  }
  
  return false;
}

/**
 * Führt eine einzelne Anfrage an einen Endpunkt aus und misst die Antwortzeit
 */
async function makeRequest(endpoint) {
  const startTime = performance.now();
  let success = false;
  let statusCode = 0;
  
  try {
    const headers = {};
    if (authToken && endpoint.requiresAuth) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await axios({
      method: endpoint.method,
      url: `${config.baseUrl}${endpoint.path}`,
      headers,
      timeout: 10000 // 10 Sekunden Timeout
    });
    
    success = response.status >= 200 && response.status < 300;
    statusCode = response.status;
  } catch (error) {
    statusCode = error.response ? error.response.status : 0;
    console.error(`Fehler bei ${endpoint.method} ${endpoint.path}: ${error.message}`);
  }
  
  const endTime = performance.now();
  const responseTime = endTime - startTime;
  
  return {
    endpoint: endpoint.path,
    method: endpoint.method,
    responseTime,
    success,
    statusCode
  };
}

/**
 * Führt Lasttests für alle konfigurierten Endpunkte durch
 */
async function runLoadTest() {
  console.log('=== API-Lasttest wird gestartet ===');
  console.log(`Basis-URL: ${config.baseUrl}`);
  console.log(`Gleichzeitige Benutzer: ${config.concurrentUsers}`);
  console.log(`Anfragen pro Benutzer: ${config.requestsPerUser}`);
  console.log('===================================');
  
  // Authentifizierung, falls benötigt
  const needsAuth = config.endpoints.some(endpoint => endpoint.requiresAuth);
  if (needsAuth) {
    const loggedIn = await login();
    if (!loggedIn && needsAuth) {
      console.error('Authentifizierung fehlgeschlagen, Tests werden abgebrochen');
      return;
    }
  }
  
  const results = {};
  
  // Für jeden Endpunkt
  for (const endpoint of config.endpoints) {
    console.log(`\nTeste ${endpoint.method} ${endpoint.path}...`);
    
    const endpointResults = [];
    const startTime = performance.now();
    
    // Simuliere mehrere gleichzeitige Benutzer
    const userPromises = [];
    
    for (let user = 0; user < config.concurrentUsers; user++) {
      userPromises.push((async () => {
        for (let req = 0; req < config.requestsPerUser; req++) {
          const result = await makeRequest(endpoint);
          endpointResults.push(result);
          
          // Kleine Verzögerung zwischen Anfragen
          if (req < config.requestsPerUser - 1) {
            await new Promise(resolve => setTimeout(resolve, config.delayBetweenRequests));
          }
        }
      })());
    }
    
    // Warte auf alle Benutzer
    await Promise.all(userPromises);
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Berechne Statistiken
    const responseTimes = endpointResults.map(r => r.responseTime);
    const successCount = endpointResults.filter(r => r.success).length;
    const successRate = (successCount / endpointResults.length) * 100;
    
    const stats = {
      totalRequests: endpointResults.length,
      successRate: successRate.toFixed(2) + '%',
      totalTime: totalTime.toFixed(2) + 'ms',
      averageResponseTime: (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) + 'ms',
      minResponseTime: Math.min(...responseTimes).toFixed(2) + 'ms',
      maxResponseTime: Math.max(...responseTimes).toFixed(2) + 'ms',
      requestsPerSecond: ((endpointResults.length / totalTime) * 1000).toFixed(2)
    };
    
    results[`${endpoint.method} ${endpoint.path}`] = stats;
    
    // Ausgabe der Ergebnisse für diesen Endpunkt
    console.log(`Ergebnisse für ${endpoint.method} ${endpoint.path}:`);
    console.log(`  Anfragen gesamt: ${stats.totalRequests}`);
    console.log(`  Erfolgsrate: ${stats.successRate}`);
    console.log(`  Gesamtzeit: ${stats.totalTime}`);
    console.log(`  Durchschnittliche Antwortzeit: ${stats.averageResponseTime}`);
    console.log(`  Minimale Antwortzeit: ${stats.minResponseTime}`);
    console.log(`  Maximale Antwortzeit: ${stats.maxResponseTime}`);
    console.log(`  Anfragen pro Sekunde: ${stats.requestsPerSecond}`);
  }
  
  console.log('\n=== Lasttest abgeschlossen ===');
  
  return results;
}

// Führe den Lasttest aus
runLoadTest()
  .then(results => {
    console.log('\nZusammenfassung der Ergebnisse:');
    console.table(results);
  })
  .catch(error => {
    console.error('Fehler beim Ausführen des Lasttests:', error);
  });
