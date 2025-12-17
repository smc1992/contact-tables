# API Rate-Limiting-Strategie

## Übersicht

Diese Dokumentation beschreibt die implementierte Rate-Limiting-Strategie für die API-Endpunkte der Contact-Tables-Anwendung. Das Rate-Limiting wurde eingeführt, um die API vor Überlastung zu schützen, faire Ressourcennutzung zu gewährleisten und die Verfügbarkeit des Dienstes für alle Nutzer sicherzustellen.

## Implementierung

Die Rate-Limiting-Funktionalität wurde als wiederverwendbare Middleware implementiert, die auf Next.js API-Routen angewendet werden kann. Die Implementierung verwendet einen In-Memory-Store für die Nachverfolgung der Anfragen und kann für verschiedene Endpunkte unterschiedlich konfiguriert werden.

### Technische Details

- **Datei**: `src/utils/rate-limit.ts`
- **Speichermechanismus**: In-Memory-Store (für Produktionsumgebungen wird ein verteilter Cache wie Redis empfohlen)
- **Schlüsselgenerierung**: Standardmäßig basierend auf der IP-Adresse des Clients, kann aber angepasst werden
- **Konfigurierbare Parameter**: Limit, Zeitfenster, Schlüsselgenerierung, Skip-Logik
- **HTTP-Header**: Setzt Standard-Rate-Limit-Header (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)

### Anwendung auf API-Routen

Die Rate-Limiting-Middleware wird nach der Caching-Middleware angewendet, sodass gecachte Antworten nicht gegen das Rate-Limit zählen. Dies optimiert die Ressourcennutzung und verbessert die Nutzererfahrung.

```typescript
// Beispiel für die Anwendung auf eine API-Route
const handlerWithCache = withCache(apiHandler, {
  ttl: 60 * 1000,
  staleWhileRevalidate: true
});

export default withRateLimit(handlerWithCache, {
  limit: 100,
  windowMs: 60 * 1000
});
```

## Konfigurierte Limits

Die folgenden Rate-Limits wurden für die verschiedenen API-Endpunkte konfiguriert:

| Endpunkt | Limit | Zeitfenster | Begründung |
|----------|-------|-------------|------------|
| `/api/restaurants` | 100 | 60 Sekunden | Häufig aufgerufener Endpunkt mit moderater Datenmenge |
| `/api/categories` | 200 | 60 Sekunden | Leichtgewichtiger Endpunkt mit statischen Daten |
| `/api/featured-restaurants` | 150 | 60 Sekunden | Wird auf der Startseite verwendet, benötigt höheres Limit |
| `/api/search` | 60 | 60 Sekunden | Rechenintensiver Endpunkt, strengeres Limit zum Schutz der Ressourcen |

## Verhalten bei Limitüberschreitung

Wenn ein Client das Rate-Limit überschreitet:

1. Die API gibt einen HTTP-Statuscode `429 Too Many Requests` zurück
2. Die Antwort enthält einen `Retry-After`-Header, der angibt, wann der Client erneut anfragen kann
3. Die Antwort enthält eine JSON-Nachricht mit einer benutzerfreundlichen Fehlermeldung

## Testresultate

Die Rate-Limiting-Implementierung wurde mit einem speziellen Testskript (`scripts/test-rate-limit.js`) getestet, das mehrere aufeinanderfolgende Anfragen an die API-Endpunkte sendet. Die Ergebnisse bestätigen, dass:

1. Die Rate-Limits korrekt durchgesetzt werden
2. Die HTTP-Header korrekt gesetzt werden
3. Die Antwortzeiten konsistent bleiben, auch unter Last
4. Die 429-Fehlerantworten korrekt zurückgegeben werden

| Endpunkt | Erfolgsrate | Rate-Limited | Anmerkungen |
|----------|-------------|--------------|-------------|
| `/api/restaurants` | 83,3% | 16,7% | Limit von 100 Anfragen wurde durchgesetzt |
| `/api/categories` | 100% | 0% | Limit von 200 Anfragen wurde nicht erreicht |
| `/api/featured-restaurants` | 100% | 0% | Limit von 150 Anfragen wurde nicht erreicht |
| `/api/search` | 50% | 50% | Strenges Limit von 60 Anfragen wurde durchgesetzt |

## Empfehlungen für die Produktion

Für den Produktionseinsatz empfehlen wir folgende Verbesserungen:

1. **Verteilter Cache**: Ersetzen des In-Memory-Stores durch einen verteilten Cache wie Redis, um Rate-Limiting über mehrere Server-Instanzen hinweg zu unterstützen
2. **Differenzierte Limits**: Implementierung unterschiedlicher Limits für authentifizierte und nicht-authentifizierte Benutzer
3. **Burst-Handling**: Implementierung von Token-Bucket-Algorithmen für besseres Handling von Anfragespitzen
4. **Monitoring**: Einrichtung von Monitoring und Alerts für Rate-Limit-Überschreitungen
5. **Client-Identifikation**: Verbesserung der Client-Identifikation über IP-Adressen hinaus (z.B. API-Schlüssel)

## Integration mit Caching

Die Rate-Limiting-Strategie wurde so konzipiert, dass sie nahtlos mit der bestehenden Caching-Strategie zusammenarbeitet:

1. Caching reduziert die Anzahl der Anfragen, die gegen das Rate-Limit zählen
2. Die Kombination aus Caching und Rate-Limiting bietet optimalen Schutz und Leistung
3. Die Reihenfolge der Middleware-Anwendung (zuerst Cache, dann Rate-Limit) ist entscheidend für die Effizienz

## Fazit

Die implementierte Rate-Limiting-Strategie bietet einen robusten Schutz für die API-Endpunkte und gewährleistet eine faire Ressourcenverteilung. Die Konfiguration kann je nach Bedarf angepasst werden, und die Implementierung ist flexibel genug, um zukünftige Anforderungen zu erfüllen.
