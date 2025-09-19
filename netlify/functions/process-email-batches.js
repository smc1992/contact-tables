const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    // Verwende den CRON_SECRET aus den Umgebungsvariablen
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'CRON_SECRET ist nicht konfiguriert' })
      };
    }

    // Rufe den API-Endpunkt auf
    const response = await fetch(`${process.env.URL}/api/cron/process-email-batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`
      }
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Fehler beim Ausführen des Cron-Jobs:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Interner Serverfehler', details: error.message })
    };
  }
};
