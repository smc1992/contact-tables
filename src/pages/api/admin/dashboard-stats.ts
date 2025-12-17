import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

// Definiere die Struktur der Antwort
interface DashboardStats {
  users: number;
  restaurants: number;
  pendingRequests: number;
  activeRestaurants: number;
  recentActivity: Array<{
    type: 'registration' | 'contract' | 'payment';
    restaurant: string;
    date: string;
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
    
    // Statistiken mit Supabase abrufen
    const [
      userCountResult,
      restaurantCountResult,
      pendingRequestCountResult,
      activeRestaurantCountResult,
      recentRegistrationsResult,
      recentContractsResult,
      recentPaymentsResult
    ] = await Promise.all([
      // Gesamtzahl der Benutzer
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),
      
      // Gesamtzahl der Restaurants
      supabase
        .from('restaurants')
        .select('id', { count: 'exact', head: true }),
      
      // Anzahl der ausstehenden Anfragen (PENDING)
      supabase
        .from('restaurants')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', false)
        .eq('contract_status', 'PENDING'),
      
      // Anzahl der aktiven Restaurants (ACTIVE)
      supabase
        .from('restaurants')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('contract_status', 'ACTIVE'),
      
      // Neueste Registrierungen (letzte 5)
      supabase
        .from('restaurants')
        .select('name, created_at')
        .eq('is_active', false)
        .eq('contract_status', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Neueste Vertragsabschlüsse (letzte 5)
      supabase
        .from('restaurant_contracts')
        .select(`
          created_at,
          restaurant:restaurant_id (name)
        `)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(5),
        
      // Neueste Zahlungen (letzte 5)
      supabase
        .from('payments')
        .select(`
          created_at,
          amount,
          restaurant:restaurant_id (name)
        `)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);
    
    // Fehlerbehandlung für die Abfragen
    if (userCountResult.error || restaurantCountResult.error || 
        pendingRequestCountResult.error || activeRestaurantCountResult.error ||
        recentRegistrationsResult.error || recentContractsResult.error ||
        recentPaymentsResult.error) {
      console.error('Fehler beim Abrufen der Dashboard-Statistiken:', 
        userCountResult.error || restaurantCountResult.error || 
        pendingRequestCountResult.error || activeRestaurantCountResult.error ||
        recentRegistrationsResult.error || recentContractsResult.error ||
        recentPaymentsResult.error);
      return res.status(500).json({ message: 'Fehler beim Abrufen der Dashboard-Statistiken' });
    }
    
    // Daten extrahieren
    const userCount = userCountResult.count || 0;
    const restaurantCount = restaurantCountResult.count || 0;
    const pendingRequestCount = pendingRequestCountResult.count || 0;
    const activeRestaurantCount = activeRestaurantCountResult.count || 0;
    const recentRegistrations = recentRegistrationsResult.data || [];
    const recentContracts = recentContractsResult.data || [];
    const recentPayments = recentPaymentsResult.data || [];
    
    // Aktivitäten zusammenführen und nach Datum sortieren
    const recentActivity = [
      ...recentRegistrations.map((reg: any) => ({
        type: 'registration' as const,
        restaurant: reg.name,
        date: reg.created_at
      })),
      ...recentContracts.map((contract: any) => ({
        type: 'contract' as const,
        restaurant: contract.restaurant?.name || 'Unbekanntes Restaurant',
        date: contract.created_at
      })),
      ...recentPayments.map((payment: any) => ({
        type: 'payment' as const,
        restaurant: payment.restaurant?.name || 'Unbekanntes Restaurant',
        date: payment.created_at,
        amount: payment.amount
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
     .slice(0, 10); // Nur die 10 neuesten Aktivitäten
    
    // Dashboard-Statistiken zusammenstellen
    const stats: DashboardStats = {
      users: userCount,
      restaurants: restaurantCount,
      pendingRequests: pendingRequestCount,
      activeRestaurants: activeRestaurantCount,
      recentActivity
    };
    
    // Antwort senden
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Fehler beim Abrufen der Dashboard-Statistiken:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  } finally {
    // Keine Verbindung zu schließen bei Supabase
  }
}
