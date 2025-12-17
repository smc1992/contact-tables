import { NextApiRequest, NextApiResponse } from 'next';

// Vereinfachter Events-Handler für Tests
export default async function mockEventsHandler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  // GET /api/admin/events
  if (req.method === 'GET') {
    // Simulierte Events-Daten für Tests
    const events = [
      {
        id: '1',
        name: 'Test Event 1',
        description: 'Description for test event 1',
        date: new Date().toISOString(),
        location: 'Test Location 1',
        maxParticipants: 10,
        currentParticipants: 5,
        status: 'active'
      },
      {
        id: '2',
        name: 'Test Event 2',
        description: 'Description for test event 2',
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        location: 'Test Location 2',
        maxParticipants: 20,
        currentParticipants: 10,
        status: 'active'
      }
    ];

    // Statistiken
    const stats = {
      total: 25,
      upcoming: 10,
      avgCapacity: 10,
      avgParticipation: 5
    };

    // Prüfe auf Test-Szenario Header
    const testScenario = req.headers['x-test-scenario'];
    
    if (testScenario === 'error') {
      return res.status(500).json({
        ok: false,
        message: 'Error fetching events'
      });
    }

    return res.status(200).json({
      ok: true,
      data: {
        events,
        stats
      }
    });
  }

  // POST /api/admin/events
  if (req.method === 'POST') {
    // Prüfe auf Test-Szenario Header
    const testScenario = req.headers['x-test-scenario'];
    
    // Validiere erforderliche Felder
    if (testScenario === 'missing-fields' || !req.body.name || !req.body.date) {
      return res.status(400).json({
        ok: false,
        message: 'Missing required fields: name, date'
      });
    }

    // Simuliere Event-Erstellung
    const newEvent = {
      id: 'new-event-id',
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    return res.status(201).json({
      ok: true,
      data: newEvent,
      message: 'Event created successfully'
    });
  }

  // PUT /api/admin/events
  if (req.method === 'PUT') {
    // Prüfe auf Test-Szenario Header
    const testScenario = req.headers['x-test-scenario'];
    
    // Simuliere Event nicht gefunden
    if (testScenario === 'not-found') {
      return res.status(404).json({
        ok: false,
        message: 'Event not found'
      });
    }

    // Simuliere Event-Aktualisierung
    const updatedEvent = {
      id: req.body.id || 'event-id',
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      ok: true,
      data: updatedEvent,
      message: 'Event updated successfully'
    });
  }

  // DELETE /api/admin/events
  if (req.method === 'DELETE') {
    // Simuliere Event-Löschung
    return res.status(200).json({
      ok: true,
      message: 'Event deleted successfully'
    });
  }

  // Fallback für unbekannte Methoden
  return res.status(405).json({
    ok: false,
    message: 'Method not allowed'
  });
}
