/**
 * Detaillierter API-Lasttest für Contact-Tables
 * 
 * Dieses Skript führt umfangreiche Lasttests für die wichtigsten API-Endpunkte durch
 * und generiert einen detaillierten Bericht über die Leistung und Stabilität.
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Konfiguration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  outputDir: path.join(__dirname, '../reports'),
  scenarios: [
    {
      name: 'Niedrige Last',
      concurrentUsers: 5,
      requestsPerUser: 10,
      delayBetweenRequests: 200
    },
    {
      name: 'Mittlere Last',
      concurrentUsers: 20,
      requestsPerUser: 15,
      delayBetweenRequests: 100
    },
    {
      name: 'Hohe Last',
      concurrentUsers: 50,
      requestsPerUser: 20,
      delayBetweenRequests: 50
    }
  ],
  endpoints: [
    // Öffentliche Endpunkte
    { path: '/api/restaurants', method: 'GET', description: 'Liste aller Restaurants' },
    { path: '/api/categories', method: 'GET', description: 'Kategorien abrufen' },
    { path: '/api/featured-restaurants', method: 'GET', description: 'Hervorgehobene Restaurants' },
    { path: '/api/search?query=restaurant', method: 'GET', description: 'Restaurantsuche' },
    
    // Authentifizierte Endpunkte (erfordern Token)
    { 
      path: '/api/customer/reservations', 
      method: 'GET', 
      description: 'Kundenreservierungen',
      requiresAuth: true 
    },
    { 
      path: '/api/restaurant/tables', 
      method: 'GET', 
      description: 'Restauranttische',
      requiresAuth: true 
    }
  ]
};

// Authentifizierungsdaten
let authToken = null;

/**
 * Führt einen Login durch, um ein Auth-Token zu erhalten
 */
async function login() {
  try {
    console.log('Authentifizierung wird durchgeführt...');
    
    // Diese Anmeldedaten sollten nur für Testzwecke verwendet werden
    const response = await axios.post(`${config.baseUrl}/api/auth/login`, {
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'testpassword'
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
  let responseSize = 0;
  
  try {
    const headers = {};
    if (authToken && endpoint.requiresAuth) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await axios({
      method: endpoint.method,
      url: `${config.baseUrl}${endpoint.path}`,
      headers,
      timeout: 15000 // 15 Sekunden Timeout
    });
    
    success = response.status >= 200 && response.status < 300;
    statusCode = response.status;
    
    // Größe der Antwort berechnen
    if (response.data) {
      responseSize = JSON.stringify(response.data).length;
    }
  } catch (error) {
    statusCode = error.response ? error.response.status : 0;
    console.error(`Fehler bei ${endpoint.method} ${endpoint.path}: ${error.message}`);
  }
  
  const endTime = performance.now();
  const responseTime = endTime - startTime;
  
  return {
    endpoint: endpoint.path,
    method: endpoint.method,
    description: endpoint.description,
    responseTime,
    success,
    statusCode,
    responseSize,
    timestamp: new Date().toISOString()
  };
}

/**
 * Berechnet Perzentile für ein Array von Zahlen
 */
function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

/**
 * Führt Lasttests für ein bestimmtes Szenario durch
 */
async function runScenario(scenario) {
  console.log(`\n=== Szenario: ${scenario.name} ===`);
  console.log(`Gleichzeitige Benutzer: ${scenario.concurrentUsers}`);
  console.log(`Anfragen pro Benutzer: ${scenario.requestsPerUser}`);
  console.log(`Verzögerung zwischen Anfragen: ${scenario.delayBetweenRequests}ms`);
  console.log('===================================');
  
  const scenarioResults = {};
  const startTimeScenario = performance.now();
  
  // Authentifizierung, falls benötigt
  const needsAuth = config.endpoints.some(endpoint => endpoint.requiresAuth);
  if (needsAuth) {
    const loggedIn = await login();
    if (!loggedIn && needsAuth) {
      console.warn('Authentifizierung fehlgeschlagen, authentifizierte Endpunkte werden übersprungen');
    }
  }
  
  // Für jeden Endpunkt
  for (const endpoint of config.endpoints) {
    // Überspringe authentifizierte Endpunkte, wenn keine Authentifizierung vorhanden ist
    if (endpoint.requiresAuth && !authToken) {
      console.warn(`Überspringe ${endpoint.method} ${endpoint.path} (erfordert Authentifizierung)`);
      continue;
    }
    
    console.log(`\nTeste ${endpoint.method} ${endpoint.path} (${endpoint.description})...`);
    
    const endpointResults = [];
    const startTime = performance.now();
    
    // Simuliere mehrere gleichzeitige Benutzer
    const userPromises = [];
    
    for (let user = 0; user < scenario.concurrentUsers; user++) {
      userPromises.push((async () => {
        for (let req = 0; req < scenario.requestsPerUser; req++) {
          const result = await makeRequest(endpoint);
          endpointResults.push(result);
          
          // Kleine Verzögerung zwischen Anfragen
          if (req < scenario.requestsPerUser - 1) {
            await new Promise(resolve => setTimeout(resolve, scenario.delayBetweenRequests));
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
    const responseSizes = endpointResults.map(r => r.responseSize).filter(size => size > 0);
    
    const stats = {
      totalRequests: endpointResults.length,
      successCount,
      failureCount: endpointResults.length - successCount,
      successRate: successRate.toFixed(2) + '%',
      totalTime: totalTime.toFixed(2) + 'ms',
      averageResponseTime: (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) + 'ms',
      minResponseTime: Math.min(...responseTimes).toFixed(2) + 'ms',
      maxResponseTime: Math.max(...responseTimes).toFixed(2) + 'ms',
      p50ResponseTime: calculatePercentile(responseTimes, 50).toFixed(2) + 'ms',
      p90ResponseTime: calculatePercentile(responseTimes, 90).toFixed(2) + 'ms',
      p95ResponseTime: calculatePercentile(responseTimes, 95).toFixed(2) + 'ms',
      p99ResponseTime: calculatePercentile(responseTimes, 99).toFixed(2) + 'ms',
      requestsPerSecond: ((endpointResults.length / totalTime) * 1000).toFixed(2),
      averageResponseSize: responseSizes.length > 0 ? 
        (responseSizes.reduce((a, b) => a + b, 0) / responseSizes.length).toFixed(2) + ' bytes' : 
        'N/A',
      rawResults: endpointResults
    };
    
    scenarioResults[`${endpoint.method} ${endpoint.path}`] = stats;
    
    // Ausgabe der Ergebnisse für diesen Endpunkt
    console.log(`Ergebnisse für ${endpoint.method} ${endpoint.path}:`);
    console.log(`  Anfragen gesamt: ${stats.totalRequests}`);
    console.log(`  Erfolgreiche Anfragen: ${stats.successCount}`);
    console.log(`  Fehlgeschlagene Anfragen: ${stats.failureCount}`);
    console.log(`  Erfolgsrate: ${stats.successRate}`);
    console.log(`  Gesamtzeit: ${stats.totalTime}`);
    console.log(`  Durchschnittliche Antwortzeit: ${stats.averageResponseTime}`);
    console.log(`  Minimale Antwortzeit: ${stats.minResponseTime}`);
    console.log(`  Maximale Antwortzeit: ${stats.maxResponseTime}`);
    console.log(`  50% Perzentil (Median): ${stats.p50ResponseTime}`);
    console.log(`  90% Perzentil: ${stats.p90ResponseTime}`);
    console.log(`  95% Perzentil: ${stats.p95ResponseTime}`);
    console.log(`  99% Perzentil: ${stats.p99ResponseTime}`);
    console.log(`  Anfragen pro Sekunde: ${stats.requestsPerSecond}`);
    console.log(`  Durchschnittliche Antwortgröße: ${stats.averageResponseSize}`);
  }
  
  const endTimeScenario = performance.now();
  const totalTimeScenario = endTimeScenario - startTimeScenario;
  
  console.log(`\nSzenario "${scenario.name}" abgeschlossen in ${(totalTimeScenario / 1000).toFixed(2)} Sekunden`);
  
  return {
    scenario: scenario.name,
    totalTime: totalTimeScenario,
    timestamp: new Date().toISOString(),
    results: scenarioResults
  };
}

/**
 * Speichert die Ergebnisse in einer JSON-Datei
 */
function saveResults(results) {
  // Stelle sicher, dass das Ausgabeverzeichnis existiert
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `api-load-test-results-${timestamp}.json`;
  const filepath = path.join(config.outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  console.log(`\nErgebnisse wurden gespeichert in: ${filepath}`);
  
  return filepath;
}

/**
 * Generiert einen HTML-Bericht aus den Ergebnissen
 */
function generateHtmlReport(results, jsonFilePath) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `api-load-test-report-${timestamp}.html`;
  const filepath = path.join(config.outputDir, filename);
  
  // HTML-Bericht erstellen
  let html = `
  <!DOCTYPE html>
  <html lang="de">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API-Lasttest-Bericht - Contact Tables</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      h1, h2, h3 {
        color: #2c3e50;
      }
      .summary {
        background-color: #f8f9fa;
        border-radius: 5px;
        padding: 15px;
        margin-bottom: 20px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      th, td {
        padding: 12px 15px;
        border: 1px solid #ddd;
        text-align: left;
      }
      th {
        background-color: #4b6584;
        color: white;
      }
      tr:nth-child(even) {
        background-color: #f8f9fa;
      }
      .success {
        color: #27ae60;
      }
      .warning {
        color: #f39c12;
      }
      .danger {
        color: #e74c3c;
      }
      .scenario {
        margin-bottom: 30px;
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 15px;
      }
      .chart-container {
        height: 300px;
        margin-bottom: 30px;
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  </head>
  <body>
    <h1>API-Lasttest-Bericht - Contact Tables</h1>
    <div class="summary">
      <p><strong>Datum:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Basis-URL:</strong> ${config.baseUrl}</p>
      <p><strong>Getestete Szenarien:</strong> ${results.length}</p>
      <p><strong>Detaillierte Ergebnisse:</strong> <a href="${path.basename(jsonFilePath)}" target="_blank">JSON-Datei herunterladen</a></p>
    </div>
    
    <h2>Zusammenfassung der Szenarien</h2>
    <table>
      <thead>
        <tr>
          <th>Szenario</th>
          <th>Gesamtzeit</th>
          <th>Zeitstempel</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  results.forEach(result => {
    html += `
        <tr>
          <td>${result.scenario}</td>
          <td>${(result.totalTime / 1000).toFixed(2)} Sekunden</td>
          <td>${new Date(result.timestamp).toLocaleString()}</td>
        </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
    
    <div class="chart-container">
      <canvas id="responseTimeChart"></canvas>
    </div>
    
    <div class="chart-container">
      <canvas id="successRateChart"></canvas>
    </div>
  `;
  
  // Detaillierte Ergebnisse für jedes Szenario
  results.forEach(result => {
    html += `
    <div class="scenario">
      <h2>Szenario: ${result.scenario}</h2>
      
      <table>
        <thead>
          <tr>
            <th>Endpunkt</th>
            <th>Anfragen</th>
            <th>Erfolgsrate</th>
            <th>Durchschn. Antwortzeit</th>
            <th>Median (P50)</th>
            <th>P95</th>
            <th>P99</th>
            <th>Anfragen/Sek</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    Object.entries(result.results).forEach(([endpoint, stats]) => {
      const successRateNum = parseFloat(stats.successRate);
      let successClass = 'success';
      if (successRateNum < 95) successClass = 'warning';
      if (successRateNum < 90) successClass = 'danger';
      
      html += `
          <tr>
            <td>${endpoint}</td>
            <td>${stats.totalRequests}</td>
            <td class="${successClass}">${stats.successRate}</td>
            <td>${stats.averageResponseTime}</td>
            <td>${stats.p50ResponseTime}</td>
            <td>${stats.p95ResponseTime}</td>
            <td>${stats.p99ResponseTime}</td>
            <td>${stats.requestsPerSecond}</td>
          </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    </div>
    `;
  });
  
  // JavaScript für die Diagramme
  html += `
    <script>
      // Daten für die Diagramme vorbereiten
      const scenarioLabels = ${JSON.stringify(results.map(r => r.scenario))};
      
      // Antwortzeiten-Diagramm
      const responseTimeData = {
        labels: scenarioLabels,
        datasets: [
    `;
  
  // Sammle alle eindeutigen Endpunkte
  const allEndpoints = new Set();
  results.forEach(result => {
    Object.keys(result.results).forEach(endpoint => allEndpoints.add(endpoint));
  });
  
  // Erstelle für jeden Endpunkt einen Datensatz
  const endpoints = Array.from(allEndpoints);
  endpoints.forEach((endpoint, index) => {
    const colors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
      'rgba(83, 102, 255, 0.7)',
    ];
    
    const color = colors[index % colors.length];
    
    html += `
          {
            label: '${endpoint}',
            data: [
    `;
    
    results.forEach(result => {
      const stats = result.results[endpoint];
      if (stats) {
        html += `${parseFloat(stats.averageResponseTime)},`;
      } else {
        html += 'null,';
      }
    });
    
    html += `
            ],
            backgroundColor: '${color}',
            borderColor: '${color.replace('0.7', '1')}',
            borderWidth: 1
          },
    `;
  });
  
  html += `
        ]
      };
      
      // Erfolgsraten-Diagramm
      const successRateData = {
        labels: scenarioLabels,
        datasets: [
    `;
  
  endpoints.forEach((endpoint, index) => {
    const colors = [
      'rgba(46, 204, 113, 0.7)',
      'rgba(52, 152, 219, 0.7)',
      'rgba(155, 89, 182, 0.7)',
      'rgba(52, 73, 94, 0.7)',
      'rgba(22, 160, 133, 0.7)',
      'rgba(39, 174, 96, 0.7)',
      'rgba(41, 128, 185, 0.7)',
      'rgba(142, 68, 173, 0.7)',
    ];
    
    const color = colors[index % colors.length];
    
    html += `
          {
            label: '${endpoint}',
            data: [
    `;
    
    results.forEach(result => {
      const stats = result.results[endpoint];
      if (stats) {
        html += `${parseFloat(stats.successRate)},`;
      } else {
        html += 'null,';
      }
    });
    
    html += `
            ],
            backgroundColor: '${color}',
            borderColor: '${color.replace('0.7', '1')}',
            borderWidth: 1
          },
    `;
  });
  
  html += `
        ]
      };
      
      // Diagramme erstellen
      window.addEventListener('load', function() {
        // Antwortzeiten-Diagramm
        new Chart(document.getElementById('responseTimeChart'), {
          type: 'bar',
          data: responseTimeData,
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Durchschnittliche Antwortzeiten (ms)'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': ' + context.raw + ' ms';
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Antwortzeit (ms)'
                }
              }
            }
          }
        });
        
        // Erfolgsraten-Diagramm
        new Chart(document.getElementById('successRateChart'), {
          type: 'bar',
          data: successRateData,
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Erfolgsraten (%)'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': ' + context.raw + '%';
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: 'Erfolgsrate (%)'
                }
              }
            }
          }
        });
      });
    </script>
  </body>
  </html>
  `;
  
  fs.writeFileSync(filepath, html);
  console.log(`HTML-Bericht wurde erstellt: ${filepath}`);
  
  return filepath;
}

/**
 * Hauptfunktion zum Ausführen aller Lasttests
 */
async function runLoadTests() {
  console.log('=== API-Lasttest wird gestartet ===');
  console.log(`Basis-URL: ${config.baseUrl}`);
  console.log(`Anzahl der Szenarien: ${config.scenarios.length}`);
  console.log(`Anzahl der Endpunkte: ${config.endpoints.length}`);
  console.log('===================================');
  
  const allResults = [];
  
  // Führe jeden Szenario aus
  for (const scenario of config.scenarios) {
    const result = await runScenario(scenario);
    allResults.push(result);
  }
  
  // Speichere die Ergebnisse
  const jsonFilePath = saveResults(allResults);
  
  // Generiere HTML-Bericht
  const htmlFilePath = generateHtmlReport(allResults, jsonFilePath);
  
  console.log('\n=== Lasttest abgeschlossen ===');
  console.log(`Ergebnisse wurden gespeichert in: ${jsonFilePath}`);
  console.log(`HTML-Bericht wurde erstellt: ${htmlFilePath}`);
  
  return {
    jsonFilePath,
    htmlFilePath,
    results: allResults
  };
}

// Führe die Lasttests aus
runLoadTests()
  .catch(error => {
    console.error('Fehler beim Ausführen der Lasttests:', error);
    process.exit(1);
  });
