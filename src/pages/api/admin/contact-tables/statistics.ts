import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

// Definiere die Struktur der Antwort
interface ContactTableStatistics {
  totalTables: number;
  activeTables: number;
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  averageSuccessRate: number;
  tablesByPopularity: Array<{
    id: string;
    name: string;
    restaurantName: string;
    reservationCount: number;
    successRate: number;
  }>;
  reservationsByDay: {
    [key: string]: number;
  };
  reservationsByHour: {
    [key: string]: number;
  };
  reservationTrend: Array<{
    date: string;
    count: number;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Nur GET-Anfragen erlauben
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Supabase-Client erstellen
  const supabase = createClient({ req, res });
  
  // Authentifizierung prüfen
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  // Prüfen, ob der Benutzer ein Admin ist
  if (user.user_metadata?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Keine Berechtigung' });
  }
  
  try {
    // Statistiken direkt über Supabase abrufen
    // Gesamtzahl der Kontakttische
    const { count: totalTables, error: totalTablesError } = await supabase
      .from('contact_tables')
      .select('*', { count: 'exact', head: true });
      
    if (totalTablesError) throw totalTablesError;
    
    // Aktive Kontakttische
    const { count: activeTables, error: activeTablesError } = await supabase
      .from('contact_tables')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
      
    if (activeTablesError) throw activeTablesError;
    
    // Gesamtzahl der Reservierungen
    const { count: totalReservations, error: totalReservationsError } = await supabase
      .from('participations')
      .select('*', { count: 'exact', head: true });
      
    if (totalReservationsError) throw totalReservationsError;
    
    // Abgeschlossene Reservierungen
    const { count: completedReservations, error: completedReservationsError } = await supabase
      .from('participations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'COMPLETED');
      
    if (completedReservationsError) throw completedReservationsError;
    
    // Stornierte Reservierungen
    const { count: cancelledReservations, error: cancelledReservationsError } = await supabase
      .from('participations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'CANCELLED');
      
    if (cancelledReservationsError) throw cancelledReservationsError;
    
    // Kontakttische nach Beliebtheit
    let tablesByPopularity: Array<{
      id: string;
      name: string;
      restaurant_name: string;
      reservation_count: number;
      success_rate: number;
    }> = [];
    
    const { data: tablesPopularityData, error: tablesByPopularityError } = await supabase
      .rpc('get_tables_by_popularity', { limit_count: 20 });
      
    if (tablesByPopularityError || !tablesPopularityData) {
      console.error('Fehler bei get_tables_by_popularity RPC:', tablesByPopularityError);
      // Fallback-Abfrage, wenn die RPC-Funktion nicht existiert
      const { data: tablesData, error: tablesError } = await supabase
        .from('contact_tables')
        .select(`
          id,
          name,
          restaurants!inner(id, name),
          participations!contact_table_id(id, status)
        `)
        .limit(20);
        
      if (tablesError) throw tablesError;
      
      // Manuelles Aggregieren der Daten
      if (tablesData) {
        tablesByPopularity = tablesData.map((table: any) => {
          const reservations = table.participations || [];
          const completedCount = reservations.filter((r: any) => r.status === 'COMPLETED').length;
          const successRate = reservations.length > 0 ? (completedCount / reservations.length) * 100 : 0;
          
          return {
            id: table.id,
            name: table.name,
            restaurant_name: table.restaurants?.name || 'Unbekannt',
            reservation_count: reservations.length,
            success_rate: parseFloat(successRate.toFixed(2))
          };
        }).sort((a, b) => b.reservation_count - a.reservation_count);
      }
    } else {
      tablesByPopularity = tablesPopularityData;
    }
    
    // Reservierungen nach Wochentag
    let reservationsByDay: Array<{ day_of_week: number, count: number }> = [];
    
    const { data: dayData, error: reservationsByDayError } = await supabase
      .rpc('get_reservations_by_day');
      
    if (reservationsByDayError || !dayData) {
      console.error('Fehler bei get_reservations_by_day RPC:', reservationsByDayError);
      // Fallback mit leeren Daten
      reservationsByDay = Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, count: 0 }));
    } else {
      reservationsByDay = dayData;
    }
    
    // Reservierungen nach Stunde
    let reservationsByHour: Array<{ hour: number, count: number }> = [];
    
    const { data: hourData, error: reservationsByHourError } = await supabase
      .rpc('get_reservations_by_hour');
      
    if (reservationsByHourError || !hourData) {
      console.error('Fehler bei get_reservations_by_hour RPC:', reservationsByHourError);
      // Fallback mit leeren Daten
      reservationsByHour = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    } else {
      reservationsByHour = hourData;
    }
    
    // Reservierungstrend (letzte 30 Tage)
    let reservationTrend: Array<{ date: Date, count: number }> = [];
    
    const { data: trendData, error: reservationTrendError } = await supabase
      .rpc('get_reservation_trend', { days_back: 30 });
      
    if (reservationTrendError || !trendData) {
      console.error('Fehler bei get_reservation_trend RPC:', reservationTrendError);
      // Fallback mit leeren Daten für die letzten 30 Tage
      reservationTrend = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date,
          count: 0
        };
      });
    } else {
      reservationTrend = trendData.map((item: any) => ({
        date: new Date(item.date),
        count: Number(item.count)
      }));
    }
    
    // Durchschnittliche Erfolgsrate berechnen
    const averageSuccessRate = (totalReservations || 0) > 0 
      ? ((completedReservations || 0) / (totalReservations || 1)) * 100 
      : 0;
    
    // Kontakttische nach Beliebtheit formatieren
    const formattedTablesByPopularity = tablesByPopularity.map((table: any) => ({
      id: table.id,
      name: table.name,
      restaurantName: table.restaurant_name,
      reservationCount: Number(table.reservation_count),
      successRate: Number(table.success_rate)
    }));
    
    // Reservierungen nach Wochentag formatieren
    const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const dayMap: { [key: string]: number } = {};
    reservationsByDay.forEach((item: any) => {
      dayMap[dayNames[item.day_of_week]] = Number(item.count);
    });
    
    // Reservierungen nach Stunde formatieren
    const hourMap: { [key: string]: number } = {};
    reservationsByHour.forEach((item: any) => {
      hourMap[`${item.hour}:00`] = Number(item.count);
    });
    
    // Reservierungstrend formatieren
    const formattedReservationTrend = reservationTrend.map((item: any) => ({
      date: item.date.toISOString().split('T')[0],
      count: Number(item.count)
    }));
    
    // Kontakttisch-Statistiken zusammenstellen
    const statistics: ContactTableStatistics = {
      totalTables: totalTables || 0,
      activeTables: activeTables || 0,
      totalReservations: totalReservations || 0,
      completedReservations: completedReservations || 0,
      cancelledReservations: cancelledReservations || 0,
      averageSuccessRate,
      tablesByPopularity: formattedTablesByPopularity,
      reservationsByDay: dayMap,
      reservationsByHour: hourMap,
      reservationTrend: formattedReservationTrend
    };
    
    // Antwort senden
    return res.status(200).json(statistics);
  } catch (error) {
    console.error('Fehler beim Abrufen der Kontakttisch-Statistiken:', error);
    return res.status(500).json({ message: 'Interner Serverfehler', error });
  } finally {
    // Keine Verbindung zu schließen bei Supabase
  }
}
