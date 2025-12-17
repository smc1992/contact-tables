import { NextApiRequest, NextApiResponse } from 'next';

// Vereinfachter Email-Tracking-Handler für Tests
export default async function mockEmailTrackingHandler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  // GET /api/admin/email-tracking
  if (req.method === 'GET') {
    // Simulierte Tracking-Daten für Tests
    const events = [
      {
        id: '1',
        email_id: 'email-123',
        recipient_id: 'user-456',
        event_type: 'open',
        created_at: new Date().toISOString(),
        metadata: { ip: '127.0.0.1', user_agent: 'Test Browser' }
      },
      {
        id: '2',
        email_id: 'email-123',
        recipient_id: 'user-789',
        event_type: 'click',
        created_at: new Date().toISOString(),
        metadata: { ip: '127.0.0.1', user_agent: 'Test Browser', url: 'https://example.com/offer' }
      }
    ];

    // Filtern nach event_type, falls angegeben
    const eventType = req.query.event_type as string;
    const filteredEvents = eventType 
      ? events.filter(event => event.event_type === eventType)
      : events;

    return res.status(200).json({
      ok: true,
      data: {
        events: filteredEvents
      }
    });
  }

  // POST /api/email-tracking/pixel
  if (req.url?.includes('/pixel') && req.method === 'POST') {
    // GIF-Pixel für Email-Öffnungs-Tracking
    const TRANSPARENT_GIF_BUFFER = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(TRANSPARENT_GIF_BUFFER);
  }

  // POST /api/email-tracking/click
  if (req.url?.includes('/click') && req.method === 'POST') {
    // Redirect für Click-Tracking
    const targetUrl = req.body.url || 'https://example.com/offer';
    res.setHeader('Location', targetUrl);
    return res.status(302).end();
  }

  // GET /api/admin/email-tracking/stats
  if (req.url?.includes('/stats') && req.method === 'GET') {
    // Simulierte Statistik-Daten für Tests
    return res.status(200).json({
      ok: true,
      data: {
        stats: {
          total: 1000,
          opens: 450,
          clicks: 225,
          openRate: 45,
          clickRate: 22.5,
          clickToOpenRate: 50
        }
      }
    });
  }

  // Fallback für unbekannte Routen oder Methoden
  return res.status(400).json({ ok: false, message: 'Invalid request' });
}
