import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
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
  
  // Prisma-Client erstellen
  const prisma = new PrismaClient();
  
  try {
    
    // Statistiken abrufen
    const [
      userCount,
      restaurantCount,
      pendingRequestCount,
      activeRestaurantCount,
      recentRegistrations,
      recentContracts
    ] = await Promise.all([
      // Gesamtzahl der Benutzer
      prisma.profile.count(),
      
      // Gesamtzahl der Restaurants
      prisma.restaurant.count(),
      
      // Anzahl der ausstehenden Anfragen (PENDING)
      prisma.restaurant.count({
        where: { 
          // Verwende isActive statt status, basierend auf dem Prisma-Schema
          isActive: false,
          contractStatus: 'PENDING'
        }
      }),
      
      // Anzahl der aktiven Restaurants (ACTIVE)
      prisma.restaurant.count({
        where: { 
          isActive: true,
          contractStatus: 'ACTIVE'
        }
      }),
      
      // Neueste Registrierungen (letzte 5)
      prisma.restaurant.findMany({
        where: { 
          isActive: false,
          contractStatus: 'PENDING'
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          name: true,
          createdAt: true
        }
      }),
      
      // Neueste Vertragsabschlüsse (letzte 5)
      prisma.contract.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          createdAt: true,
          restaurant: {
            select: {
              name: true
            }
          }
        }
      })
    ]);
    
    // Aktivitäten zusammenführen und nach Datum sortieren
    const recentActivity = [
      ...recentRegistrations.map((reg: { name: string; createdAt: Date }) => ({
        type: 'registration' as const,
        restaurant: reg.name,
        date: reg.createdAt.toISOString()
      })),
      ...recentContracts.map((contract: { createdAt: Date; restaurant: { name: string } }) => ({
        type: 'contract' as const,
        restaurant: contract.restaurant.name,
        date: contract.createdAt.toISOString()
      }))
      // Zahlungen werden derzeit nicht abgefragt, da sie möglicherweise nicht im Prisma-Schema definiert sind
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
    await prisma.$disconnect();
  }
}
