# Authentifizierungsstrategie für Admin-Dashboard

## Übersicht

Dieses Dokument beschreibt die standardisierte Authentifizierungs- und Autorisierungsstrategie für alle Admin-Dashboard-Seiten und zugehörige Funktionen im Contact-Tables-Projekt.

## Grundprinzipien

1. **Serverseitige Authentifizierung**: Alle Admin-Seiten verwenden serverseitige Authentifizierung über die `withAuth` HOC.
2. **Rollenbasierte Zugriffskontrolle**: Zugriff wird basierend auf Benutzerrollen (`admin` oder `ADMIN`) gewährt.
3. **Konsistente Weiterleitungen**: Bei fehlender Authentifizierung oder Berechtigung wird einheitlich zu `/auth/login` weitergeleitet.
4. **Keine direkten Admin-API-Aufrufe im Client**: Admin-API-Funktionen werden nur über dedizierte API-Routen aufgerufen.

## Implementierungsdetails

### withAuth Higher-Order Component

Die zentrale Komponente für die Authentifizierung ist die `withAuth` HOC in `src/utils/withAuth.ts`. Diese:

- Erstellt einen Supabase-Client mit `createClient()` aus `utils/supabase/server.ts`
- Prüft, ob ein Benutzer authentifiziert ist
- Prüft, ob der Benutzer die erforderlichen Rollen besitzt
- Leitet bei fehlender Authentifizierung oder Berechtigung zu `/auth/login` weiter

```typescript
// Beispiel-Verwendung in getServerSideProps
export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'], // Erlaubte Rollen
  async (context, user) => {
    // Hier können zusätzliche Daten geladen werden
    return {
      props: { 
        user, // Immer den authentifizierten Benutzer übergeben
        // weitere Props
      }
    };
  }
);

// Komponente mit expliziter Props-Typisierung
interface MeineSeiteProps {
  user: User;
  // weitere Props
}

const MeineSeite: React.FC<MeineSeiteProps> = ({ user, ...otherProps }) => {
  // Komponentenlogik
};

export default MeineSeite; // Wichtig: Standardexport nicht vergessen!
```

### Abgesicherte Admin-Seiten

Alle Admin-Seiten sind mit `withAuth` abgesichert und verwenden das standardisierte Muster mit `getServerSideProps`. Dazu gehören:

1. `/admin/index.tsx` - Admin-Hauptseite
2. `/admin/dashboard.tsx` - Dashboard mit Statistiken und Übersichten
3. `/admin/notifications.tsx` - Benachrichtigungsverwaltung
4. `/admin/contact-tables.tsx` - Contact-Tables-Verwaltung
5. `/admin/users/index.tsx` - Benutzerverwaltung
6. `/admin/settings/index.tsx` - Systemeinstellungen
7. `/admin/restaurants/index.tsx` - Restaurant-Verwaltung
8. `/admin/amenities/index.tsx` - Ausstattungsmerkmale-Verwaltung
9. `/admin/categories/index.tsx` - Kategorien-Verwaltung
10. `/admin/cities/index.tsx` - Städte-Verwaltung
11. `/admin/email-builder/index.tsx` - E-Mail-Builder
12. `/admin/email-builder/history.tsx` - E-Mail-Versandhistorie
13. `/admin/moderation/reviews/index.tsx` - Bewertungsmoderation
14. `/admin/moderation/reviews/[id].tsx` - Bewertungsdetails
15. `/admin/moderation/comments/index.tsx` - Kommentarmoderation
16. `/admin/moderation/comments/[id].tsx` - Kommentardetails
17. `/admin/blogs/index.tsx` - Blog-Verwaltung

### API-Zugriff für Admin-Funktionen

Admin-API-Funktionen werden über dedizierte API-Routen implementiert, die:

1. Den Admin-Client mit `createAdminClient()` aus `utils/supabase/server.ts` verwenden
2. Den Service Role Key nutzen (über Umgebungsvariablen)
3. Benutzerauthentifizierung und Rollenprüfung durchführen
4. Daten gefiltert zurückgeben

Wichtige API-Routen:
- `/api/admin/dashboard` - Dashboard-Daten
- `/api/admin/users` - Benutzerverwaltung
- `/api/admin/email-users` - E-Mail-Funktionen

### Umgebungsvariablen

Für Admin-API-Routen werden folgende Umgebungsvariablen benötigt:
- `SUPABASE_SERVICE_ROLE_KEY` - Für Admin-API-Zugriffe

## Best Practices

1. **Standardisiertes `withAuth`-Muster**: Jede Admin-Seite muss `withAuth` in `getServerSideProps` implementieren, nicht als HOC für den Export der Komponente:
   ```typescript
   // RICHTIG: Standardisiertes Muster
   export const getServerSideProps = withAuth(
     ['admin', 'ADMIN'],
     async (context, user) => {
       return {
         props: { user }
       };
     }
   );
   
   // FALSCH: Altes Muster vermeiden
   export default withAuth(MeineKomponente, ['admin', 'ADMIN']);
   ```

2. **Explizite Props-Typisierung**: Jede Komponente sollte ein explizites Props-Interface definieren, das den `user` enthält:
   ```typescript
   interface MeineKomponenteProps {
     user: User;
     // weitere Props
   }
   ```

3. **Konsistente Rollenprüfung**: Rollen sollten als Array `['admin', 'ADMIN']` übergeben werden, um beide Schreibweisen zu unterstützen.

4. **Keine clientseitige Authentifizierung für Admin-Seiten**: Keine direkten Weiterleitungen im Client-Code bei fehlender Authentifizierung.

5. **Keine direkten Admin-API-Aufrufe**: Niemals direkt `supabase.auth.admin.*` im Client-Code aufrufen.

6. **Standardexport für Komponenten**: Jede Seitenkomponente muss einen `export default` haben, auch wenn `getServerSideProps` mit `withAuth` verwendet wird.

## Sicherheitshinweise

1. Der `SUPABASE_SERVICE_ROLE_KEY` muss sicher verwahrt und nur serverseitig verwendet werden.
2. Admin-API-Routen müssen immer eine zusätzliche Rollenprüfung durchführen, auch wenn sie von authentifizierten Seiten aufgerufen werden.
3. Bei API-Routen, die sensible Daten zurückgeben, sollte die Ausgabe auf das Notwendige beschränkt werden.
