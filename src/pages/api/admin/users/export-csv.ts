import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { withAdminAuth } from '../../middleware/withAdminAuth';
import { User } from '@supabase/supabase-js';

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  console.log('API-Route /api/admin/users/export-csv aufgerufen');
  
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
          
          allUsers = [...allUsers, ...moreUsers.users];
          authUsers = moreUsers;
          nextPage++;
        }
      } catch (paginationError) {
        console.error('Fehler bei der Paginierung:', paginationError);
      }
    }
    
  console.log('Alle Benutzer geladen:', allUsers.length);
  
  // Query-Parameter für Filter auslesen
  const { role, registered_from, registered_to } = req.query as {
    role?: string;
    registered_from?: string;
    registered_to?: string;
  };

  const selectedRole = role && role !== 'all' ? role : undefined;
  const fromDate = registered_from ? new Date(registered_from) : undefined;
  const toDate = registered_to ? new Date(registered_to) : undefined;

  // Anwenden der Filter auf die Benutzerliste
  const filteredUsers = allUsers.filter(u => {
    const meta = (u as any).user_metadata || {};
    const uRole: string = meta.role || 'user';

    if (selectedRole && uRole !== selectedRole) return false;

    if (fromDate) {
      const created = u.created_at ? new Date(u.created_at) : undefined;
      if (!created || created < fromDate) return false;
    }

    if (toDate) {
      const created = u.created_at ? new Date(u.created_at) : undefined;
      if (!created || created > toDate) return false;
    }

    return true;
  });

  console.log('Gefilterte Benutzer für Export:', filteredUsers.length);

  // CSV-Header definieren
  const csvHeaders = [
      'ID',
      'E-Mail',
      'Vorname',
      'Nachname',
      'Telefon',
      'Rolle',
      'Aktiv',
      'Erstellt am',
      'Letzter Login'
    ];
    
    // CSV-Daten erstellen
  const csvRows = filteredUsers.map(user => {
    const metadata = user.user_metadata || {};
    const firstName = metadata.first_name || metadata.name?.split(' ')[0] || '';
    const lastName = metadata.last_name || metadata.name?.split(' ').slice(1).join(' ') || '';
    const role = metadata.role || 'user';
    const phone = metadata.phone || '';
    // banned_until ist nicht Teil des typisierten Supabase-User-Interfaces; sicher ermitteln
    const bannedUntil = (user as any)?.banned_until as string | null | undefined;
    const activeStr = bannedUntil && new Date(bannedUntil) > new Date() ? 'Nein' : 'Ja';
    
    return [
      user.id,
      user.email || '',
      firstName,
      lastName,
      phone,
      role,
      activeStr,
      user.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : '',
      user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('de-DE') : 'Nie'
    ];
  });
    
    // CSV-String erstellen
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => {
          // Escape Anführungszeichen und umschließe Felder mit Kommas oder Anführungszeichen
          const stringField = String(field || '');
          if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
          }
          return stringField;
        }).join(',')
      )
    ].join('\n');
    
    // CSV-Response senden
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `benutzer-export-${timestamp}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // UTF-8 BOM für korrekte Darstellung in Excel
    res.write('\uFEFF');
    res.write(csvContent);
    res.end();
    
    console.log(`CSV-Export erfolgreich: ${filteredUsers.length} Benutzer exportiert`);
    
  } catch (error) {
    console.error('Fehler beim CSV-Export:', error);
    res.status(500).json({ 
      error: 'Fehler beim Exportieren der Benutzerdaten',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
}

export default withAdminAuth(handler);