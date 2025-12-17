import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { withAdminAuth } from '../middleware/withAdminAuth';

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  console.log('API-Route /api/admin/email-users aufgerufen');
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
    
    // Filtere nur Benutzer mit der Rolle CUSTOMER
    const customerUsers = allUsers.filter(user => {
      const role = user.user_metadata?.role || '';
      return role.toUpperCase() === 'CUSTOMER';
    });
    
    console.log('Anzahl gefundener CUSTOMER-Benutzer:', customerUsers.length);
    
    return res.status(200).json({ 
      users: customerUsers
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
      error: 'Fehler beim Laden der Benutzerdaten',
      errorDetails: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
