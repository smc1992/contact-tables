import { NextApiRequest, NextApiResponse } from 'next';

// Vereinfachter Handler für Tests
export default async function mockSystemStatusHandler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simulierte Systemstatus-Daten für Tests
  const systemStatus = {
    api: { status: 'online', latency: 50, last_checked: new Date().toISOString() },
    database: { status: 'online', latency: 50, last_checked: new Date().toISOString() },
    payment: { status: 'online', latency: 100, last_checked: new Date().toISOString() },
    email: { status: 'online', latency: 150, last_checked: new Date().toISOString() }
  };

  // Für den Test "service degradation"
  if (req.headers['x-test-scenario'] === 'degraded') {
    systemStatus.payment.status = 'degraded';
    systemStatus.payment.latency = 1500;
  }
  
  // Für den Test "service failures"
  if (req.headers['x-test-scenario'] === 'failure') {
    systemStatus.email.status = 'offline';
    systemStatus.email.latency = null as any;
    systemStatus.database.status = 'offline';
  }

  return res.status(200).json(systemStatus);
}
