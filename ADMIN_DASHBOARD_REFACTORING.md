# Admin Dashboard Refactoring

## Übersicht der Änderungen

Dieses Dokument beschreibt die Umstellung des Admin-Dashboards auf serverseitige Authentifizierung und die Entfernung direkter Admin API-Aufrufe.

### 1. Serverseitige Authentifizierung mit withAuth HOC

Das Admin-Dashboard wurde auf serverseitige Authentifizierung mit dem `withAuth` Higher-Order Component umgestellt. Dies bietet folgende Vorteile:

- Konsistente Authentifizierungsprüfung für alle Admin-Seiten
- Vermeidung von Redirect-Loops durch einheitliche Authentifizierungsmethode
- Rollenbasierte Zugriffskontrolle direkt auf dem Server
- Bessere Sicherheit durch frühzeitige Authentifizierungsprüfung

Implementierung:
```tsx
export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'], // Erlaubte Rollen
  async (context, user) => {
    console.log('getServerSideProps für /admin/dashboard wird ausgeführt');
    console.log('Benutzerrolle:', user.user_metadata?.role);
    console.log('Admin-Berechtigung bestätigt, Seite wird geladen');
    
    return {
      props: {}
    };
  }
);
```

### 2. Entfernung direkter Admin API-Aufrufe

Alle direkten Supabase-Abfragen im Client-Code wurden durch API-Routen ersetzt:

- Aktualisierung der API-Route `/api/admin/dashboard.ts` zur Verwendung des serverseitigen Supabase-Clients
- Implementierung korrekter Authentifizierung und Rollenprüfung in der API-Route
- Verwendung des Admin-Clients (`createAdminClient()`) für privilegierte Datenbankabfragen

### 3. Optimierung der Dashboard-Datenabfrage

Die `loadDashboardData`-Funktion wurde überarbeitet, um alle Daten über die zentrale API-Route zu laden:

```tsx
const loadDashboardData = useCallback(async () => {
  setRefreshing(true);
  try {
    console.log('Starte Dashboard-Datenabfrage über API...');
    
    // Alle Dashboard-Daten über die zentrale API-Route abrufen
    const dashboardResponse = await fetch('/api/admin/dashboard', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      credentials: 'same-origin' // Wichtig für Cookies/Session
    });
    
    // Verarbeitung der API-Antwort...
  } catch (error) {
    console.error('Fehler beim Laden der Dashboard-Daten:', error);
    // Fallback zu Dummy-Daten bei Fehler...
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [fetchSystemStatus, fetchAnalyticsData]);
```

## Wichtige Hinweise

1. Die Umgebungsvariable `SUPABASE_SERVICE_ROLE_KEY` muss sowohl in der lokalen `.env`-Datei als auch in der Netlify-Konfiguration gesetzt sein.
2. Die `target: 'serverless'`-Eigenschaft wurde aus der `next.config.js`-Datei entfernt, da sie in neueren Next.js-Versionen nicht mehr unterstützt wird.
3. Alle Admin-Seiten sollten das `withAuth` HOC für konsistente Authentifizierung verwenden.
4. API-Routen sollten den serverseitigen Supabase-Client aus `utils/supabase/server.ts` verwenden.

## Nächste Schritte

- Überprüfung weiterer Admin-Seiten auf konsistente Authentifizierung
- Optimierung der Echtzeit-Abonnements für Dashboard-Updates
- Implementierung weiterer API-Routen für Admin-Funktionen
