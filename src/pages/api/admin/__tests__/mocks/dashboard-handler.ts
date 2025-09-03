import { NextApiRequest, NextApiResponse } from 'next';

// Vereinfachter Dashboard-Handler für Tests
export default async function mockDashboardHandler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  // Simulierte Fehler für Tests
  if (req.headers['x-test-scenario'] === 'error') {
    return res.status(500).json({ ok: false, message: 'Error fetching dashboard data' });
  }

  // Simulierte Dashboard-Daten für Tests
  const dashboardData = {
    ok: true,
    financials: {
      totalRevenue: 12500,
      monthlyRevenue: 2500,
      averageOrderValue: 125,
      pendingPayments: 750
    },
    users: {
      total: 500,
      active: 350,
      new: 50,
      restaurants: 30,
      customers: 470
    },
    reservations: {
      total: 1200,
      pending: 150,
      confirmed: 950,
      cancelled: 100
    },
    emails: {
      total: 5000,
      delivered: 4800,
      opened: 3600,
      clicked: 1800,
      bounced: 200,
      openRate: 75,
      clickRate: 37.5,
      deliveryRate: 96
    }
  };

  // Für den Test "email metrics calculation"
  if (req.headers['x-test-scenario'] === 'email-metrics') {
    dashboardData.emails = {
      total: 1000,
      delivered: 900,
      opened: 450,
      clicked: 225,
      bounced: 100,
      openRate: 50,  // 450/900 * 100
      clickRate: 25, // 225/900 * 100
      deliveryRate: 90 // 900/1000 * 100
    };
  }

  return res.status(200).json(dashboardData);
}
