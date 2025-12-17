const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log('Starte E-Mail-Batch-Verarbeitung...');
  
  try {
    // Verwende den CRON_SECRET aus den Umgebungsvariablen
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('CRON_SECRET ist nicht konfiguriert!');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'CRON_SECRET ist nicht konfiguriert' })
      };
    }

    // Prüfe, ob die URL korrekt konfiguriert ist
    const baseUrl = process.env.URL || process.env.DEPLOY_URL || process.env.DEPLOY_PRIME_URL || '';
    if (!baseUrl) {
      console.error('Keine URL-Umgebungsvariable gefunden!');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'URL-Umgebungsvariable fehlt' })
      };
    }
    
    const apiUrl = `${baseUrl}/api/cron/process-email-batches`;
    console.log(`Rufe API-Endpunkt auf: ${apiUrl}`);

    // Rufe den API-Endpunkt auf
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`
      }
    });

    console.log(`API-Antwort erhalten: Status ${response.status}`);
    
    let data;
    try {
      const textResponse = await response.text();
      console.log(`Antwort-Text: ${textResponse.substring(0, 200)}${textResponse.length > 200 ? '...' : ''}`);
      data = JSON.parse(textResponse);
    } catch (parseError) {
      console.error('Fehler beim Parsen der Antwort:', parseError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Fehler beim Parsen der Antwort', details: parseError.message })
      };
    }

    if (!response.ok) {
      console.error(`API-Fehler: ${response.status} ${response.statusText}`, data);
    } else {
      console.log('Batch-Verarbeitung erfolgreich:', {
        processed: data.processed || 0,
        scheduled: data.scheduled || 0,
        errors: data.errors || []
      });
    }

    return {
      statusCode: response.status,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Fehler beim Ausführen des Cron-Jobs:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Interner Serverfehler', details: error.message, stack: error.stack })
    };
  }
};
