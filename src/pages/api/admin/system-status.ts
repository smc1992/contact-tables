import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Supabase-Client erstellen
    const supabase = createClient({ req, res });
    
    // Benutzer authentifizieren
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }
    
    if (user.user_metadata?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    // Systemstatus aus der Datenbank abrufen
    const { data: systemStatusData, error: systemStatusError } = await supabase
      .from('system_status')
      .select('*');

    if (systemStatusError) {
      console.error('Fehler beim Abrufen des Systemstatus:', systemStatusError);
      return res.status(500).json({ error: 'Fehler beim Abrufen des Systemstatus' });
    }

    // Status-Daten formatieren
    const statusMap = systemStatusData?.reduce((acc, item) => {
      acc[item.service] = {
        status: item.status,
        latency: item.latency || 0,
        last_checked: item.last_checked
      };
      return acc;
    }, {});

    // Aktuelle Latenz für API und Datenbank messen
    const startTime = performance.now();
    const { data: healthCheck, error: healthCheckError } = await supabase
      .from('health_check')
      .select('*')
      .limit(1);
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    // Systemstatus zusammenstellen
    const systemStatus = {
      api: {
        status: healthCheckError ? 'degraded' : 'online',
        latency: latency,
        last_checked: new Date().toISOString()
      },
      database: {
        status: healthCheckError ? 'degraded' : 'online',
        latency: latency,
        last_checked: new Date().toISOString()
      },
      payment: statusMap?.payment || { status: 'unknown', latency: 0, last_checked: null },
      email: statusMap?.email || { status: 'unknown', latency: 0, last_checked: null }
    };

    // Status zurückgeben
    return res.status(200).json(systemStatus);
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}
