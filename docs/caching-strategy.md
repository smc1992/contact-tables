# Caching-Strategie für Contact Tables

Diese Dokumentation beschreibt die implementierte Caching-Strategie für häufig abgerufene Daten in der Contact Tables Anwendung.

## Überblick

Die Caching-Strategie wurde entwickelt, um:

1. Die Serverbelastung zu reduzieren
2. Die Anwendungsgeschwindigkeit zu verbessern
3. Die Benutzererfahrung durch schnellere Ladezeiten zu optimieren
4. Netzwerkverkehr zu minimieren

## Implementierte Komponenten

### 1. Basis-Cache-Utility (`/src/utils/cache.ts`)

Die grundlegende Cache-Utility bietet folgende Funktionen:

- `setCache<T>(key, data, options)`: Speichert Daten im lokalen Cache
- `getCache<T>(key, options)`: Ruft Daten aus dem Cache ab
- `invalidateCache(key)`: Löscht einen bestimmten Cache-Eintrag
- `invalidateCacheByPrefix(prefix)`: Löscht alle Cache-Einträge mit einem bestimmten Präfix
- `cachedFetch<T>(key, fetchFn, options)`: Wrapper für asynchrone Datenabfragen mit Cache-Unterstützung

Konfigurationsoptionen:
- `ttl`: Time-to-Live in Millisekunden (Standard: 5 Minuten)
- `staleWhileRevalidate`: Wenn true, werden abgelaufene Daten zurückgegeben und im Hintergrund aktualisiert

### 2. API-Cache-Utility (`/src/utils/api-cache.ts`)

Erweitert die Basis-Cache-Utility speziell für API-Anfragen:

- `cachedApiRequest<T>(url, options)`: Führt eine API-Anfrage mit Cache-Unterstützung durch
- `cachedGet<T>(url, options)`: GET-Anfrage mit Cache-Unterstützung
- `apiPost<T, D>(url, data, options)`: POST-Anfrage (ohne Caching)
- `apiPut<T, D>(url, data, options)`: PUT-Anfrage (ohne Caching)
- `apiDelete<T>(url, options)`: DELETE-Anfrage (ohne Caching)

### 3. React Hooks

#### useCache (`/src/hooks/useCache.ts`)

Ein Hook für allgemeines Daten-Caching mit folgenden Features:
- Automatisches Abrufen beim ersten Rendern
- Aktualisierung bei Fokussierung des Fensters
- Manuelles Invalidieren und Neuladen
- Stale-While-Revalidate-Strategie

```tsx
const { 
  data, 
  isLoading, 
  error, 
  refetch, 
  invalidateAndRefetch 
} = useCache<DataType>(
  'cache-key',
  fetchFunction,
  {
    ttl: 5 * 60 * 1000, // 5 Minuten
    autoFetch: true,
    revalidateOnFocus: true,
    staleWhileRevalidate: true
  }
);
```

#### useApiCache (`/src/hooks/useApiCache.ts`)

Ein spezialisierter Hook für API-Anfragen mit CRUD-Operationen:
- GET-Anfragen mit Cache
- POST, PUT, DELETE ohne Cache (da diese Operationen Daten ändern)
- Automatische Invalidierung nach Änderungsoperationen

```tsx
const { 
  data, 
  isLoading, 
  error, 
  get, 
  post, 
  put, 
  delete: deleteData 
} = useApiCache<DataType>(
  '/api/endpoint',
  {
    ttl: 5 * 60 * 1000,
    autoFetch: true,
    revalidateOnFocus: true
  }
);
```

## Beispielkomponenten

### RestaurantList (`/src/components/restaurant/RestaurantList.tsx`)

Zeigt eine Liste von Restaurants mit Caching-Unterstützung:
- Cached Restaurantdaten für 5 Minuten
- Bietet einen "Aktualisieren"-Button zum manuellen Neuladen
- Zeigt Lade- und Fehlerzustände an

### CachedReservationsList (`/src/components/restaurant/CachedReservationsList.tsx`)

Zeigt eine paginierte Liste von Reservierungen mit Caching-Unterstützung:
- Cached Reservierungsdaten für 2 Minuten
- Unterstützt Paginierung mit Cache pro Seite
- Zeigt Lade- und Fehlerzustände an
- Bietet einen "Aktualisieren"-Button zum manuellen Neuladen

## Best Practices für die Verwendung

### Wann Caching verwenden?

Caching eignet sich besonders für:

1. **Häufig abgerufene, selten geänderte Daten**:
   - Restaurantlisten
   - Menüs
   - Statische Konfigurationen

2. **Daten, die von mehreren Komponenten verwendet werden**:
   - Benutzerprofile
   - Globale Einstellungen

3. **Ressourcenintensive API-Anfragen**:
   - Komplexe Abfragen mit Joins
   - Große Datensätze mit Paginierung

### Wann kein Caching verwenden?

Caching sollte vermieden werden für:

1. **Häufig geänderte Daten**:
   - Echtzeit-Benachrichtigungen
   - Live-Statusanzeigen

2. **Sicherheitskritische Daten**:
   - Authentifizierungstokens
   - Berechtigungsinformationen

3. **Personalisierte Daten, die sich pro Benutzer unterscheiden**:
   - Personalisierte Empfehlungen (es sei denn, sie werden pro Benutzer gecached)

### Cache-Invalidierung

Wichtig ist, den Cache in folgenden Situationen zu invalidieren:

1. Nach Änderungsoperationen (POST, PUT, DELETE)
2. Bei Benutzeraktionen, die den Datenstand ändern könnten
3. Bei Rollenwechsel oder Abmeldung des Benutzers

## Implementierungsbeispiel

```tsx
// Beispiel für eine Komponente, die Caching verwendet
import { useCache } from '@/hooks/useCache';
import { createClient } from '@/utils/supabase/client';

function EventsList() {
  const supabase = createClient();
  
  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
      
    if (error) throw error;
    return data;
  };
  
  const { 
    data: events, 
    isLoading, 
    error, 
    invalidateAndRefetch 
  } = useCache('events-list', fetchEvents, {
    ttl: 10 * 60 * 1000, // 10 Minuten
    revalidateOnFocus: true
  });
  
  // Komponenten-Rendering...
}
```

## Performance-Überlegungen

- **Cache-Größe**: Achten Sie darauf, nicht zu viele oder zu große Daten zu cachen, um den Speicherverbrauch zu minimieren.
- **TTL-Werte**: Wählen Sie angemessene TTL-Werte basierend auf der Änderungshäufigkeit der Daten.
- **Stale-While-Revalidate**: Verwenden Sie diese Strategie für eine bessere Benutzererfahrung bei gleichzeitiger Datenaktualität.

## Debugging

Bei Problemen mit dem Caching:

1. Überprüfen Sie die Browser-Konsole auf Warnungen oder Fehler.
2. Verwenden Sie die Browser-DevTools, um den localStorage-Inhalt zu inspizieren.
3. Fügen Sie temporär Logging-Anweisungen in die Cache-Funktionen ein.
4. Verwenden Sie die `invalidateCache`-Funktion, um problematische Cache-Einträge zu löschen.

## Zukünftige Erweiterungen

- Implementierung eines serverseitigen Caches für API-Routen
- Integration mit einem verteilten Cache-System für Multi-Instance-Deployments
- Automatische Cache-Invalidierung durch Webhook-Benachrichtigungen bei Datenänderungen
