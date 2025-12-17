# API-Lasttest-Berichte

Dieses Verzeichnis enthält die Ergebnisse und Berichte der API-Lasttests für das Contact-Tables-Projekt.

## Verfügbare Skripte

- `load-test.js`: Einfacher Lasttest für API-Endpunkte
- `api-load-test.js`: Detaillierter Lasttest mit mehreren Szenarien und HTML-Bericht
- `analyze-load-test.js`: Analysiert die Ergebnisse und gibt Optimierungsempfehlungen

## Verwendung

### Einfacher Lasttest

```bash
node scripts/load-test.js
```

### Detaillierter Lasttest mit Szenarien

```bash
node scripts/api-load-test.js
```

### Analyse der Ergebnisse

```bash
node scripts/analyze-load-test.js [Pfad zur Ergebnisdatei]
```

Wenn kein Pfad angegeben wird, wird automatisch die neueste Ergebnisdatei verwendet.

## Konfiguration

Die Lasttests können über die Umgebungsvariablen in der Datei `.env.load-test` konfiguriert werden:

- `NEXT_PUBLIC_BASE_URL`: Die Basis-URL der zu testenden API
- `TEST_USER_EMAIL` und `TEST_USER_PASSWORD`: Anmeldedaten für authentifizierte Anfragen
- `LOAD_TEST_CONCURRENT_USERS`: Anzahl der gleichzeitigen Benutzer
- `LOAD_TEST_REQUESTS_PER_USER`: Anzahl der Anfragen pro Benutzer
- `LOAD_TEST_DELAY_BETWEEN_REQUESTS`: Verzögerung zwischen Anfragen in ms

## Berichtsformate

- `api-load-test-results-[Zeitstempel].json`: Rohdaten der Lasttests
- `api-load-test-report-[Zeitstempel].html`: HTML-Bericht mit Diagrammen
- `api-load-test-analysis-[Zeitstempel].md`: Markdown-Bericht mit Analyse und Empfehlungen
