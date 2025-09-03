import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '../middleware/withAdminAuth';

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
  is_active: boolean;
  banned_until?: string | null;
  metadata?: Record<string, any>;
  has_restaurant?: boolean;
  restaurant?: {
    id: string;
    name: string;
    contractStatus?: string | null;
    isVisible?: boolean;
    slug?: string | null;
  };
}

interface AuthUser {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
  banned_until?: string | null;
  user_metadata?: {
    role?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  raw_user_meta_data?: Record<string, any>;
  raw_app_meta_data?: Record<string, any>;
}

interface GroupedUsers {
  admin: User[];
  restaurant: User[];
  customer: User[];
  user: User[];
  [key: string]: User[];
}

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  console.log('API-Route /api/admin/users aufgerufen');
  try {
    // Nur GET-Anfragen erlauben
    if (req.method !== 'GET') {
      console.log('Methode nicht erlaubt:', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Supabase-Client erstellen
    const supabase = createClient({ req, res });
    console.log('Supabase-Client erstellt');
    
    // Benutzer ist bereits durch withAdminAuth authentifiziert und autorisiert
    console.log('Authentifizierter Admin-Benutzer:', userId);
    
    // Benutzer über die Admin-API abrufen
    console.log('Rufe Benutzer über Admin-API ab...');
    
    // Erstelle einen Admin-Client mit Service Role Key
    let adminSupabase;
    let authUsers;
    let authError;
    
    try {
      adminSupabase = createAdminClient();
      
      const result = await adminSupabase.auth.admin.listUsers({
        perPage: 1000,
        page: 1
      });
      
      authUsers = result.data;
      authError = result.error;
      
      if (authError) {
        console.error('Fehler bei Admin-API:', authError);
        throw authError;
      }
    } catch (adminError) {
      console.error('Fehler beim Erstellen des Admin-Clients oder Abrufen der Benutzer:', adminError);
      console.log('Verwende Fallback für Benutzerliste...');
      
      // Fallback: Verwende den normalen Supabase-Client, um zumindest den aktuellen Benutzer zu erhalten
      const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
      
      if (currentUserError) {
        console.error('Fehler beim Abrufen des aktuellen Benutzers:', currentUserError);
        throw currentUserError;
      }
      
      // Erstelle eine minimale Benutzerliste mit dem aktuellen Benutzer
      authUsers = {
        users: currentUser ? [currentUser.user] : []
      };
    }
    
    // Wenn mehr als 1000 Benutzer vorhanden sind, weitere Seiten abrufen
    let allUsers = authUsers?.users || [];
    console.log('Erste Seite Benutzer geladen:', allUsers.length);
    
    // Weitere Seiten nur laden, wenn wir einen gültigen Admin-Client haben und die erste Seite voll war
    if (adminSupabase && authUsers?.users?.length === 1000) {
      let nextPage = 2;
      try {
        while (authUsers?.users?.length === 1000) {
          console.log(`Lade Benutzerseite ${nextPage}...`);
          const { data: moreUsers, error: moreError } = await adminSupabase.auth.admin.listUsers({
            perPage: 1000,
            page: nextPage
          });
          
          if (moreError) {
            console.error(`Fehler beim Laden der Seite ${nextPage}:`, moreError);
            break;
          }
          
          if (!moreUsers?.users?.length) {
            console.log(`Keine weiteren Benutzer auf Seite ${nextPage}`);
            break;
          }
          
          console.log(`Seite ${nextPage} geladen: ${moreUsers.users.length} Benutzer`);
          allUsers = [...allUsers, ...moreUsers.users];
          nextPage++;
          
          // Sicherheitsabbruch nach 10 Seiten (10.000 Benutzer)
          if (nextPage > 10) {
            console.log('Maximale Seitenzahl erreicht (10)');
            break;
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden weiterer Benutzerseiten:', error);
        // Wir fahren mit den bereits geladenen Benutzern fort
      }
    } else {
      console.log('Keine weiteren Benutzerseiten geladen (kein Admin-Client oder erste Seite nicht voll)');
    }
    
    console.log('Gesamtzahl geladener Benutzer:', allUsers.length);
    
    // Profile aus profiles Tabelle abrufen
    console.log('Lade Profile...');
    let profiles = [];
    try {
      const { data, error: profilesError } = await supabase.from('profiles').select('*');
      
      if (profilesError) {
        console.error('Fehler beim Laden der Profile:', profilesError);
        console.log('Verwende leere Profil-Liste als Fallback');
        // Wir werfen keinen Fehler, sondern setzen mit leerer Liste fort
      } else {
        profiles = data || [];
        console.log('Anzahl geladener Profile:', profiles.length);
      }
    } catch (profileQueryError) {
      console.error('Unerwarteter Fehler beim Laden der Profile:', profileQueryError);
      console.log('Verwende leere Profil-Liste als Fallback');
      // Wir setzen die Ausführung mit einer leeren Profil-Liste fort
    }
    
    console.log('Anzahl geladener Profile:', profiles?.length || 0);
    
    // Restaurants aus der Datenbank (Prisma) laden
    console.log('Lade Restaurants...');
    let restaurants = [];
    let restaurantsByUserId = new Map();
    
    try {
      const prisma = new PrismaClient();
      
      try {
        restaurants = await prisma.restaurant.findMany({
          select: {
            id: true,
            userId: true,
            name: true,
            contractStatus: true,
            isVisible: true,
            slug: true,
          }
        });
        
        restaurantsByUserId = new Map(restaurants.map(r => [r.userId, r]));
        console.log('Anzahl geladener Restaurants:', restaurants.length);
      } catch (prismaError) {
        console.error('Fehler beim Laden der Restaurants mit Prisma:', prismaError);
        console.log('Verwende leere Restaurant-Liste als Fallback');
        // Wir setzen die Ausführung mit einer leeren Restaurant-Liste fort
      } finally {
        // Stellen Sie sicher, dass die Prisma-Verbindung immer geschlossen wird
        await prisma.$disconnect().catch(e => 
          console.error('Fehler beim Schließen der Prisma-Verbindung:', e)
        );
      }
    } catch (prismaInitError) {
      console.error('Fehler beim Initialisieren des Prisma-Clients:', prismaInitError);
      console.log('Verwende leere Restaurant-Liste als Fallback');
      // Wir setzen die Ausführung mit einer leeren Restaurant-Liste fort
    }
    
    // Daten zusammenführen und nach Rollen gruppieren
    console.log('Führe Benutzerdaten zusammen und gruppiere nach Rollen...');
    const groupedUsers: GroupedUsers = {
      admin: [],
      restaurant: [],
      customer: [],
      user: []
    };
    
    const mergedUsers = allUsers.map((authUser: AuthUser) => {
      const profile = profiles?.find(p => p.id === authUser.id) || {};
      const userMetadata = authUser.user_metadata || {};
      const rawUserMetadata = authUser.raw_user_meta_data || {};
      
      // Rolle aus verschiedenen Quellen bestimmen (Priorität: raw_user_meta_data > user_metadata > profile > default)
      let role = (rawUserMetadata.role || userMetadata.role || profile.role || 'user').toLowerCase();
      
      // Normalisiere Rollen (CUSTOMER -> customer, etc.)
      if (role.toUpperCase() === 'CUSTOMER') role = 'customer';
      if (role.toUpperCase() === 'RESTAURANT') role = 'restaurant';
      if (role.toUpperCase() === 'ADMIN') role = 'admin';
      
      const r = restaurantsByUserId.get(authUser.id);
      
      const user: User = {
        id: authUser.id,
        email: authUser.email || '',
        role: role,
        name: profile.name || rawUserMetadata.name || userMetadata.name || '',
        first_name: profile.first_name || rawUserMetadata.first_name || userMetadata.first_name || '',
        last_name: profile.last_name || rawUserMetadata.last_name || userMetadata.last_name || '',
        phone: profile.phone || rawUserMetadata.phone || userMetadata.phone || '',
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        is_active: !authUser.banned_until,
        banned_until: authUser.banned_until,
        metadata: {
          ...userMetadata,
          ...rawUserMetadata,
          ...profile
        },
        has_restaurant: !!r,
        restaurant: r
          ? {
              id: r.id,
              name: r.name,
              contractStatus: (r as any).contractStatus ?? null,
              isVisible: (r as any).isVisible ?? false,
              slug: (r as any).slug ?? null,
            }
          : undefined,
      };
      
      // Benutzer nach Rolle gruppieren
      if (role === 'restaurant') {
        // Nur echte Restaurants im Restaurant-Tab anzeigen
        if (r) {
          groupedUsers.restaurant.push(user);
        } else {
          // Fällt zurück in allgemeine Benutzerliste
          groupedUsers.user.push(user);
        }
      } else {
        if (!groupedUsers[role]) {
          groupedUsers[role] = [];
        }
        groupedUsers[role].push(user);
      }
      
      return user;
    });
    
    console.log('API-Antwort mit', mergedUsers.length, 'Benutzern');
    console.log('Benutzer nach Rollen:', {
      admin: groupedUsers.admin?.length || 0,
      restaurant: groupedUsers.restaurant?.length || 0,
      customer: groupedUsers.customer?.length || 0,
      user: groupedUsers.user?.length || 0
    });
    
    return res.status(200).json({ 
      users: mergedUsers,
      groupedUsers: groupedUsers
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Kein Stack trace verfügbar');
    
    // Detaillierte Fehlerinformationen für Debugging
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      type: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    // Versuche, einen minimalen Datensatz zurückzugeben, anstatt einen 500-Fehler
    return res.status(200).json({ 
      users: [],
      groupedUsers: {
        admin: [],
        restaurant: [],
        customer: [],
        user: []
      },
      error: 'Fehler beim Laden der Benutzerdaten',
      errorDetails: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
