/**
 * Analyse-Tool für API-Lasttests
 * 
 * Dieses Skript analysiert die Ergebnisse der API-Lasttests und gibt Empfehlungen
 * für Optimierungen basierend auf den Leistungsdaten.
 */

const fs = require('fs');
const path = require('path');

// Konfiguration
const config = {
  reportsDir: path.join(__dirname, '../reports'),
  thresholds: {
    responseTime: {
      good: 200,     // ms
      acceptable: 500 // ms
    },
    successRate: {
      good: 99,      // %
      acceptable: 95 // %
    },
    requestsPerSecond: {
      low: 10,       // Anfragen pro Sekunde
      medium: 50     // Anfragen pro Sekunde
    }
  }
};

/**
 * Findet die neueste JSON-Ergebnisdatei im Berichtsverzeichnis
 */
function findLatestResultFile() {
  if (!fs.existsSync(config.reportsDir)) {
    console.error(`Verzeichnis nicht gefunden: ${config.reportsDir}`);
    return null;
  }
  
  const files = fs.readdirSync(config.reportsDir)
    .filter(file => file.startsWith('api-load-test-results-') && file.endsWith('.json'))
    .map(file => ({
      name: file,
      path: path.join(config.reportsDir, file),
      mtime: fs.statSync(path.join(config.reportsDir, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  if (files.length === 0) {
    console.error('Keine Ergebnisdateien gefunden');
    return null;
  }
  
  return files[0].path;
}

/**
 * Analysiert die Ergebnisse und gibt Empfehlungen
 */
function analyzeResults(results) {
  const analysis = {
    summary: {
      totalEndpoints: 0,
      endpointsWithIssues: 0,
      criticalEndpoints: []
    },
    endpointAnalysis: {},
    recommendations: []
  };
  
  // Sammle alle eindeutigen Endpunkte
  const allEndpoints = new Set();
  results.forEach(result => {
    Object.keys(result.results).forEach(endpoint => allEndpoints.add(endpoint));
  });
  
  analysis.summary.totalEndpoints = allEndpoints.size;
  
  // Analysiere jeden Endpunkt
  allEndpoints.forEach(endpoint => {
    const endpointData = {
      endpoint,
      scenarios: {},
      issues: [],
      overallRating: 'good'
    };
    
    // Sammle Daten für jeden Endpunkt aus allen Szenarien
    results.forEach(result => {
      const stats = result.results[endpoint];
      if (!stats) return;
      
      const avgResponseTime = parseFloat(stats.averageResponseTime);
      const p95ResponseTime = parseFloat(stats.p95ResponseTime);
      const successRate = parseFloat(stats.successRate);
      const requestsPerSecond = parseFloat(stats.requestsPerSecond);
      
      endpointData.scenarios[result.scenario] = {
        avgResponseTime,
        p95ResponseTime,
        successRate,
        requestsPerSecond
      };
      
      // Prüfe auf Probleme
      if (avgResponseTime > config.thresholds.responseTime.acceptable) {
        endpointData.issues.push({
          severity: 'high',
          scenario: result.scenario,
          message: `Hohe durchschnittliche Antwortzeit: ${avgResponseTime}ms (Schwellenwert: ${config.thresholds.responseTime.acceptable}ms)`
        });
        endpointData.overallRating = 'critical';
      } else if (avgResponseTime > config.thresholds.responseTime.good) {
        endpointData.issues.push({
          severity: 'medium',
          scenario: result.scenario,
          message: `Erhöhte durchschnittliche Antwortzeit: ${avgResponseTime}ms (Schwellenwert für gut: ${config.thresholds.responseTime.good}ms)`
        });
        if (endpointData.overallRating !== 'critical') {
          endpointData.overallRating = 'warning';
        }
      }
      
      if (p95ResponseTime > config.thresholds.responseTime.acceptable * 2) {
        endpointData.issues.push({
          severity: 'high',
          scenario: result.scenario,
          message: `Sehr hohe P95-Antwortzeit: ${p95ResponseTime}ms (mehr als doppelt so hoch wie akzeptabel)`
        });
        endpointData.overallRating = 'critical';
      }
      
      if (successRate < config.thresholds.successRate.acceptable) {
        endpointData.issues.push({
          severity: 'high',
          scenario: result.scenario,
          message: `Niedrige Erfolgsrate: ${successRate}% (Schwellenwert: ${config.thresholds.successRate.acceptable}%)`
        });
        endpointData.overallRating = 'critical';
      } else if (successRate < config.thresholds.successRate.good) {
        endpointData.issues.push({
          severity: 'medium',
          scenario: result.scenario,
          message: `Verbesserungswürdige Erfolgsrate: ${successRate}% (Schwellenwert für gut: ${config.thresholds.successRate.good}%)`
        });
        if (endpointData.overallRating !== 'critical') {
          endpointData.overallRating = 'warning';
        }
      }
      
      if (requestsPerSecond < config.thresholds.requestsPerSecond.low && result.scenario === 'Hohe Last') {
        endpointData.issues.push({
          severity: 'medium',
          scenario: result.scenario,
          message: `Geringe Durchsatzrate: ${requestsPerSecond} Anfragen/Sekunde (Schwellenwert: ${config.thresholds.requestsPerSecond.low})`
        });
        if (endpointData.overallRating !== 'critical') {
          endpointData.overallRating = 'warning';
        }
      }
    });
    
    // Füge zur Analyse hinzu
    analysis.endpointAnalysis[endpoint] = endpointData;
    
    // Zähle Endpunkte mit Problemen
    if (endpointData.overallRating !== 'good') {
      analysis.summary.endpointsWithIssues++;
      
      if (endpointData.overallRating === 'critical') {
        analysis.summary.criticalEndpoints.push(endpoint);
      }
    }
  });
  
  // Generiere allgemeine Empfehlungen
  if (analysis.summary.criticalEndpoints.length > 0) {
    analysis.recommendations.push({
      priority: 'high',
      title: 'Kritische Endpunkte optimieren',
      description: `${analysis.summary.criticalEndpoints.length} Endpunkte haben kritische Leistungsprobleme und sollten priorisiert werden.`,
      endpoints: analysis.summary.criticalEndpoints
    });
  }
  
  // Prüfe auf Muster bei langsamen Endpunkten
  const slowEndpoints = Object.entries(analysis.endpointAnalysis)
    .filter(([_, data]) => {
      return Object.values(data.scenarios).some(s => 
        s.avgResponseTime > config.thresholds.responseTime.good
      );
    })
    .map(([endpoint, _]) => endpoint);
  
  if (slowEndpoints.length > 0) {
    // Prüfe auf Datenbankabfragen
    const dbEndpoints = slowEndpoints.filter(endpoint => 
      endpoint.includes('users') || 
      endpoint.includes('reservations') || 
      endpoint.includes('restaurants') ||
      endpoint.includes('tables')
    );
    
    if (dbEndpoints.length > 0) {
      analysis.recommendations.push({
        priority: 'medium',
        title: 'Datenbankabfragen optimieren',
        description: 'Mehrere Endpunkte mit Datenbankabfragen zeigen erhöhte Antwortzeiten. Überprüfen Sie die Datenbankindizes und Abfragen.',
        endpoints: dbEndpoints
      });
    }
    
    // Prüfe auf Such-Endpunkte
    const searchEndpoints = slowEndpoints.filter(endpoint => 
      endpoint.includes('search') || 
      endpoint.includes('query') || 
      endpoint.includes('filter')
    );
    
    if (searchEndpoints.length > 0) {
      analysis.recommendations.push({
        priority: 'medium',
        title: 'Suchfunktionen optimieren',
        description: 'Die Suchendpunkte zeigen erhöhte Antwortzeiten. Erwägen Sie die Implementierung von Caching oder Volltextsuche.',
        endpoints: searchEndpoints
      });
    }
  }
  
  // Prüfe auf Endpunkte mit niedriger Erfolgsrate
  const lowSuccessEndpoints = Object.entries(analysis.endpointAnalysis)
    .filter(([_, data]) => {
      return Object.values(data.scenarios).some(s => 
        s.successRate < config.thresholds.successRate.good
      );
    })
    .map(([endpoint, _]) => endpoint);
  
  if (lowSuccessEndpoints.length > 0) {
    analysis.recommendations.push({
      priority: 'high',
      title: 'Fehlerbehandlung verbessern',
      description: 'Mehrere Endpunkte zeigen niedrige Erfolgsraten. Überprüfen Sie die Fehlerbehandlung und Validierung.',
      endpoints: lowSuccessEndpoints
    });
  }
  
  // Allgemeine Empfehlungen
  analysis.recommendations.push({
    priority: 'medium',
    title: 'Caching-Strategie implementieren',
    description: 'Implementieren Sie ein Caching-System für häufig abgerufene Daten, um die Antwortzeiten zu verbessern und die Serverlast zu reduzieren.'
  });
  
  analysis.recommendations.push({
    priority: 'medium',
    title: 'API-Rate-Limiting einführen',
    description: 'Implementieren Sie Rate-Limiting, um die API vor Überlastung zu schützen und eine faire Ressourcenverteilung zu gewährleisten.'
  });
  
  return analysis;
}

/**
 * Generiert einen Bericht basierend auf der Analyse
 */
function generateReport(analysis) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `api-load-test-analysis-${timestamp}.md`;
  const filepath = path.join(config.reportsDir, filename);
  
  let report = `# API-Lasttest-Analyse
  
Datum: ${new Date().toLocaleString()}

## Zusammenfassung

- Analysierte Endpunkte: ${analysis.summary.totalEndpoints}
- Endpunkte mit Leistungsproblemen: ${analysis.summary.endpointsWithIssues}
- Kritische Endpunkte: ${analysis.summary.criticalEndpoints.length}

${analysis.summary.criticalEndpoints.length > 0 ? '### Kritische Endpunkte\n\n' + analysis.summary.criticalEndpoints.map(e => `- \`${e}\``).join('\n') : ''}

## Empfehlungen

`;

  // Sortiere Empfehlungen nach Priorität
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedRecommendations = [...analysis.recommendations].sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );
  
  sortedRecommendations.forEach(rec => {
    report += `### ${rec.title} (${rec.priority.toUpperCase()})\n\n`;
    report += `${rec.description}\n\n`;
    
    if (rec.endpoints && rec.endpoints.length > 0) {
      report += `Betroffene Endpunkte:\n`;
      rec.endpoints.forEach(endpoint => {
        report += `- \`${endpoint}\`\n`;
      });
      report += '\n';
    }
  });
  
  report += `## Detaillierte Endpunkt-Analyse\n\n`;
  
  // Sortiere Endpunkte nach Bewertung (kritisch zuerst)
  const ratingOrder = { critical: 0, warning: 1, good: 2 };
  const sortedEndpoints = Object.entries(analysis.endpointAnalysis).sort((a, b) => 
    ratingOrder[a[1].overallRating] - ratingOrder[b[1].overallRating]
  );
  
  sortedEndpoints.forEach(([endpoint, data]) => {
    const ratingEmoji = data.overallRating === 'critical' ? '🔴' : 
                        data.overallRating === 'warning' ? '🟠' : '🟢';
    
    report += `### ${ratingEmoji} \`${endpoint}\`\n\n`;
    report += `Gesamtbewertung: **${data.overallRating.toUpperCase()}**\n\n`;
    
    if (data.issues.length > 0) {
      report += `#### Identifizierte Probleme\n\n`;
      data.issues.forEach(issue => {
        const severityEmoji = issue.severity === 'high' ? '⚠️' : '⚠';
        report += `- ${severityEmoji} **${issue.scenario}**: ${issue.message}\n`;
      });
      report += '\n';
    }
    
    report += `#### Leistungsdaten\n\n`;
    report += `| Szenario | Durchschn. Antwortzeit | P95 Antwortzeit | Erfolgsrate | Anfragen/Sek |\n`;
    report += `|----------|------------------------|-----------------|-------------|---------------|\n`;
    
    Object.entries(data.scenarios).forEach(([scenario, stats]) => {
      report += `| ${scenario} | ${stats.avgResponseTime}ms | ${stats.p95ResponseTime}ms | ${stats.successRate}% | ${stats.requestsPerSecond} |\n`;
    });
    
    report += '\n';
  });
  
  fs.writeFileSync(filepath, report);
  console.log(`Analysebericht wurde erstellt: ${filepath}`);
  
  return filepath;
}

/**
 * Hauptfunktion
 */
function main() {
  console.log('=== API-Lasttest-Analyse ===');
  
  // Finde die neueste Ergebnisdatei
  const resultFile = process.argv[2] || findLatestResultFile();
  if (!resultFile) {
    console.error('Keine Ergebnisdatei gefunden oder angegeben');
    process.exit(1);
  }
  
  console.log(`Analysiere Ergebnisse aus: ${resultFile}`);
  
  try {
    // Lade die Ergebnisse
    const results = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
    
    // Analysiere die Ergebnisse
    const analysis = analyzeResults(results);
    
    // Generiere einen Bericht
    const reportFile = generateReport(analysis);
    
    console.log('\n=== Analyse abgeschlossen ===');
    console.log(`Bericht wurde erstellt: ${reportFile}`);
    
    // Gib eine Zusammenfassung aus
    console.log('\nZusammenfassung:');
    console.log(`- Analysierte Endpunkte: ${analysis.summary.totalEndpoints}`);
    console.log(`- Endpunkte mit Leistungsproblemen: ${analysis.summary.endpointsWithIssues}`);
    console.log(`- Kritische Endpunkte: ${analysis.summary.criticalEndpoints.length}`);
    
    if (analysis.summary.criticalEndpoints.length > 0) {
      console.log('\nKritische Endpunkte:');
      analysis.summary.criticalEndpoints.forEach(endpoint => {
        console.log(`- ${endpoint}`);
      });
    }
    
    console.log('\nTop-Empfehlungen:');
    const topRecs = analysis.recommendations
      .filter(rec => rec.priority === 'high')
      .slice(0, 3);
    
    if (topRecs.length === 0) {
      console.log('- Keine kritischen Empfehlungen');
    } else {
      topRecs.forEach(rec => {
        console.log(`- ${rec.title}`);
      });
    }
    
  } catch (error) {
    console.error('Fehler bei der Analyse:', error);
    process.exit(1);
  }
}

// Führe das Skript aus
main();
