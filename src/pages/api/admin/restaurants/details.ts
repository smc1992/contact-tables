import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

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
  
  // Restaurant-ID aus der Anfrage holen
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
  }
  
  try {
    // Restaurant mit allen relevanten Daten abrufen
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select(`
        *,
        address:restaurant_addresses(*),
        opening_hours:restaurant_opening_hours(*),
        contact_tables:contact_tables(*, reservations:reservations(*)),
        reviews:reviews(*, user:user_id(*)),
        contract:restaurant_contracts(*),
        owner:owner_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (restaurantError) {
      console.error('Fehler beim Abrufen des Restaurants:', restaurantError);
      return res.status(500).json({ message: 'Fehler beim Abrufen des Restaurants', error: restaurantError });
    }
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }
    
    // Zusätzliche Statistiken berechnen
    const [
      totalReservationsResult,
      completedReservationsResult,
      averageRatingResult,
      monthlyReservationsResult
    ] = await Promise.all([
      // Gesamtzahl der Reservierungen
      supabase
        .from('reservations')
        .select('id', { count: 'exact' })
        .eq('contact_table.restaurant_id', id),
      
      // Abgeschlossene Reservierungen
      supabase
        .from('reservations')
        .select('id', { count: 'exact' })
        .eq('contact_table.restaurant_id', id)
        .eq('status', 'COMPLETED'),
      
      // Durchschnittliche Bewertung
      supabase
        .from('reviews')
        .select('rating')
        .eq('restaurant_id', id),
      
      // Monatliche Reservierungen (letzte 6 Monate)
      supabase
        .rpc('get_monthly_reservations', { restaurant_id: id, months_back: 6 })
    ]);
    
    // Fehlerbehandlung für die Statistikabfragen
    if (totalReservationsResult.error || completedReservationsResult.error || 
        averageRatingResult.error || monthlyReservationsResult.error) {
      console.error('Fehler beim Abrufen der Statistiken:', 
        totalReservationsResult.error || completedReservationsResult.error || 
        averageRatingResult.error || monthlyReservationsResult.error);
      return res.status(500).json({ 
        message: 'Fehler beim Abrufen der Statistiken', 
        error: totalReservationsResult.error || completedReservationsResult.error || 
               averageRatingResult.error || monthlyReservationsResult.error 
      });
    }
    
    // Daten extrahieren
    const totalReservations = totalReservationsResult.count || 0;
    const completedReservations = completedReservationsResult.count || 0;
    
    // Durchschnittliche Bewertung berechnen
    const ratings = averageRatingResult.data || [];
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length 
      : 0;
    
    // Monatliche Reservierungen formatieren
    const monthlyReservations = monthlyReservationsResult.data || [];
    
    // Monatliche Reservierungen sind bereits im richtigen Format von der RPC-Funktion
    
    // Erweiterte Restaurant-Details zusammenstellen
    const restaurantDetails = {
      ...restaurant,
      statistics: {
        totalReservations,
        completedReservations,
        averageRating,
        monthlyReservations,
        successRate: totalReservations > 0 ? (completedReservations / totalReservations) * 100 : 0
      }
    };
    
    // Antwort senden
    return res.status(200).json(restaurantDetails);
  } catch (error) {
    console.error('Fehler beim Abrufen der Restaurant-Details:', error);
    return res.status(500).json({ message: 'Interner Serverfehler', error });
  } finally {
    // Keine Verbindung zu schließen bei Supabase
  }
}
