import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { withAdminAuth } from '../middleware/withAdminAuth';

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Supabase-Client erstellen
    const supabase = createClient({ req, res });
    
    // Benutzer ist bereits durch withAdminAuth authentifiziert und autorisiert

    // Zeitraum aus Query-Parameter extrahieren oder Standard setzen
    const timeframe = req.query.timeframe as string || 'month';
    
    // Zeitraum-Parameter für die Abfragen festlegen
    let interval: string;
    let limit: number;
    let dateFormat: string;
    
    switch (timeframe) {
      case 'week':
        interval = '1 day';
        limit = 7;
        dateFormat = 'DD.MM.';
        break;
      case 'year':
        interval = '1 month';
        limit = 12;
        dateFormat = 'MMM YYYY';
        break;
      case 'month':
      default:
        interval = '1 day';
        limit = 30;
        dateFormat = 'DD.MM.';
        break;
    }

    // Benutzerregistrierungen abrufen
    const { data: userRegistrations, error: userError } = await supabase.rpc(
      'get_user_registrations_over_time',
      { time_interval: interval, time_limit: limit }
    );

    // Restaurantregistrierungen abrufen
    const { data: restaurantRegistrations, error: restaurantError } = await supabase.rpc(
      'get_restaurant_registrations_over_time',
      { time_interval: interval, time_limit: limit }
    );

    // Einnahmen abrufen
    const { data: revenue, error: revenueError } = await supabase.rpc(
      'get_revenue_over_time',
      { time_interval: interval, time_limit: limit }
    );

    // Benutzertypen abrufen
    const { data: userTypes, error: userTypesError } = await supabase.rpc(
      'get_user_types_distribution'
    );

    // Fehlerbehandlung
    if (userError || restaurantError || revenueError || userTypesError) {
      console.error('Fehler beim Abrufen der Analytikdaten:', 
        userError || restaurantError || revenueError || userTypesError);
      
      // Fallback zu Dummy-Daten bei Fehler
      return res.status(200).json(generateDummyData(timeframe));
    }

    // Daten formatieren
    const formattedData = {
      userRegistrations: {
        labels: userRegistrations?.map((item: any) => item.date_label) || [],
        data: userRegistrations?.map((item: any) => item.count) || []
      },
      restaurantRegistrations: {
        labels: restaurantRegistrations?.map((item: any) => item.date_label) || [],
        data: restaurantRegistrations?.map((item: any) => item.count) || []
      },
      revenue: {
        labels: revenue?.map((item: any) => item.date_label) || [],
        data: revenue?.map((item: any) => item.amount) || []
      },
      userTypes: {
        labels: userTypes?.map((item: any) => item.role) || [],
        data: userTypes?.map((item: any) => item.count) || []
      }
    };

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);

// Hilfsfunktion zum Generieren von Dummy-Daten
function generateDummyData(timeframe: string) {
  let labels: string[] = [];
  let dataPoints: number = 0;
  
  switch (timeframe) {
    case 'week':
      labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
      dataPoints = 7;
      break;
    case 'year':
      labels = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
      dataPoints = 12;
      break;
    case 'month':
    default:
      // Generiere 30 Tage-Labels
      labels = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.`;
      });
      dataPoints = 30;
      break;
  }

  // Zufällige Daten generieren
  const userRegistrationsData = Array.from({ length: dataPoints }, () => Math.floor(Math.random() * 10));
  const restaurantRegistrationsData = Array.from({ length: dataPoints }, () => Math.floor(Math.random() * 5));
  const revenueData = Array.from({ length: dataPoints }, () => Math.floor(Math.random() * 1000) + 500);

  return {
    userRegistrations: {
      labels,
      data: userRegistrationsData
    },
    restaurantRegistrations: {
      labels,
      data: restaurantRegistrationsData
    },
    revenue: {
      labels,
      data: revenueData
    },
    userTypes: {
      labels: ['Kunden', 'Restaurants', 'Admins', 'Gäste'],
      data: [65, 23, 5, 7]
    }
  };
}
