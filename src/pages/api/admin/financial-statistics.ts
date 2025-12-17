import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

// Definiere die Struktur der Antwort
interface FinancialStatistics {
  totalRevenue: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueTrend: Array<{
    date: string;
    amount: number;
  }>;
  paymentsByStatus: {
    [key: string]: number;
  };
  topRestaurants: Array<{
    id: string;
    name: string;
    revenue: number;
  }>;
  pendingPayments: number;
  completedPayments: number;
  averageOrderValue: number;
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
    // Aktuelles Datum
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Leere Daten für Statistiken als Fallback
    let allPayments: Array<{ amount: number }> = [];
    let paymentsToday: Array<{ amount: number }> = [];
    let paymentsThisWeek: Array<{ amount: number }> = [];
    let paymentsThisMonth: Array<{ amount: number }> = [];
    let paymentsByStatus: Array<{ status: string, count: number, total: number }> = [];
    let revenueTrend: Array<{ date: Date, amount: number }> = [];
    let topRestaurants: Array<{ id: string, name: string, revenue: number }> = [];
    let pendingPayments = 0;
    let completedPayments = 0;
    
    // Prüfen, ob die Payments-Tabelle existiert
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'payments')
      .single();
    
    // Wenn die Tabelle nicht existiert oder ein Fehler auftritt, leere Daten verwenden
    if (tableCheckError || !tableExists) {
      console.log('Payments-Tabelle existiert nicht, verwende leere Daten');
    } else {
      // Wenn die Tabelle existiert, Daten aus Supabase abrufen
      // Alle Zahlungen
      const { data: allPaymentsData, error: allPaymentsError } = await supabase
        .from('payments')
        .select('amount');
      if (allPaymentsData && !allPaymentsError) {
        allPayments = allPaymentsData as Array<{ amount: number }>;
      }
      
      // Zahlungen heute
      const { data: paymentsTodayData, error: paymentsTodayError } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', today.toISOString());
      if (paymentsTodayData && !paymentsTodayError) {
        paymentsToday = paymentsTodayData as Array<{ amount: number }>;
      }
      
      // Zahlungen diese Woche
      const { data: paymentsThisWeekData, error: paymentsThisWeekError } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', oneWeekAgo.toISOString());
      if (paymentsThisWeekData && !paymentsThisWeekError) {
        paymentsThisWeek = paymentsThisWeekData as Array<{ amount: number }>;
      }
      
      // Zahlungen diesen Monat
      const { data: paymentsThisMonthData, error: paymentsThisMonthError } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', oneMonthAgo.toISOString());
      if (paymentsThisMonthData && !paymentsThisMonthError) {
        paymentsThisMonth = paymentsThisMonthData as Array<{ amount: number }>;
      }
      
      // Zahlungen nach Status
      const { data: paymentsByStatusData, error: paymentsByStatusError } = await supabase
        .rpc('get_payments_by_status');
      if (paymentsByStatusData && !paymentsByStatusError) {
        paymentsByStatus = paymentsByStatusData as Array<{ status: string, count: number, total: number }>;
      }
      
      // Umsatztrend (letzte 30 Tage)
      const { data: revenueTrendData, error: revenueTrendError } = await supabase
        .rpc('get_revenue_trend', { days_back: 30 });
      if (revenueTrendData && !revenueTrendError) {
        revenueTrend = revenueTrendData as Array<{ date: Date, amount: number }>;
      }
      
      // Top Restaurants nach Umsatz
      const { data: topRestaurantsData, error: topRestaurantsError } = await supabase
        .rpc('get_top_restaurants', { limit_count: 10 });
      if (topRestaurantsData && !topRestaurantsError) {
        topRestaurants = topRestaurantsData as Array<{ id: string, name: string, revenue: number }>;
      }
      
      // Ausstehende Zahlungen
      const { count: pendingPaymentsCount, error: pendingPaymentsError } = await supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PENDING');
      if (pendingPaymentsCount !== null && !pendingPaymentsError) {
        pendingPayments = pendingPaymentsCount;
      }
      
      // Abgeschlossene Zahlungen
      const { count: completedPaymentsCount, error: completedPaymentsError } = await supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'COMPLETED');
      if (completedPaymentsCount !== null && !completedPaymentsError) {
        completedPayments = completedPaymentsCount;
      }
    }
    
    // Gesamtumsatz berechnen
    const totalRevenue = allPayments.reduce((sum: number, payment: { amount: number }) => sum + payment.amount, 0);
    const revenueToday = paymentsToday.reduce((sum: number, payment: { amount: number }) => sum + payment.amount, 0);
    const revenueThisWeek = paymentsThisWeek.reduce((sum: number, payment: { amount: number }) => sum + payment.amount, 0);
    const revenueThisMonth = paymentsThisMonth.reduce((sum: number, payment: { amount: number }) => sum + payment.amount, 0);
    
    // Durchschnittlicher Bestellwert
    const averageOrderValue = allPayments.length > 0 ? totalRevenue / allPayments.length : 0;
    
    // Zahlungen nach Status formatieren
    const statusMap: { [key: string]: number } = {};
    paymentsByStatus.forEach((item: { status: string, count: number, total: number }) => {
      statusMap[item.status || 'unknown'] = Number(item.total);
    });
    
    // Umsatztrend formatieren
    const formattedTrend = revenueTrend.map((item: { date: Date, amount: number }) => ({
      date: item.date.toISOString().split('T')[0],
      amount: Number(item.amount)
    }));
    
    // Top Restaurants formatieren
    const formattedTopRestaurants = topRestaurants.map((item: { id: string, name: string, revenue: number }) => ({
      id: item.id,
      name: item.name,
      revenue: Number(item.revenue)
    }));
    
    // Finanzstatistiken zusammenstellen
    const statistics: FinancialStatistics = {
      totalRevenue,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      revenueTrend: formattedTrend,
      paymentsByStatus: statusMap,
      topRestaurants: formattedTopRestaurants,
      pendingPayments: pendingPayments || 0,
      completedPayments: completedPayments || 0,
      averageOrderValue
    };
    
    // Antwort senden
    return res.status(200).json(statistics);
  } catch (error) {
    console.error('Fehler beim Abrufen der Finanzstatistiken:', error);
    return res.status(500).json({ message: 'Interner Serverfehler', error });
  } finally {
    // Keine Verbindung zu schließen bei Supabase
  }
}
