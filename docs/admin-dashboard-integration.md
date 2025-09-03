# Admin Dashboard Integration Dokumentation

Diese Dokumentation beschreibt die Integration von Email-Tracking und Event-Management in das Admin-Dashboard sowie die Konsolidierung der Admin-Dashboard-Seiten.

## Übersicht

Das Admin-Dashboard wurde um folgende Funktionen erweitert:
- Echtzeit-Email-Statistiken
- Event-Management mit Datenbankanbindung
- Verbessertes Systemstatus-Monitoring
- Echte Finanzdaten-Integration

## Dashboard-Konsolidierung

Um die Benutzerführung zu verbessern und Redundanzen zu vermeiden, wurden die Admin-Dashboard-Seiten konsolidiert:

### Hauptdashboard
- `/admin/dashboard.tsx` ist jetzt das einzige und zentrale Admin-Dashboard
- Enthält alle wichtigen Funktionen und Statistiken
- Bietet eine umfassende Übersicht über alle administrativen Bereiche

### Konsolidierte Seiten
- `/admin/index.tsx` leitet jetzt automatisch zu `/admin/dashboard` weiter
- `/dashboard/admin/index.tsx` leitet jetzt automatisch zu `/admin/dashboard` weiter

### Vorteile der Konsolidierung
- Einheitliche Benutzeroberfläche für Administratoren
- Vermeidung von doppeltem Code und Wartungsaufwand
- Klarere Navigation und Benutzerführung
- Konsistente Darstellung von Daten und Funktionen

## API-Routen

### 1. `/api/admin/dashboard.ts`

**Funktion**: Zentrale API für Dashboard-Daten
- Nutzerstatistiken (Gesamtzahl, neue Nutzer, aktive Nutzer)
- Restaurantstatistiken (Gesamtzahl, neue Restaurants, aktive Restaurants)
- Finanzstatistiken (Gesamtumsatz, monatlicher Umsatz, ausstehende Zahlungen)
- Email-Statistiken (Kampagnen, gesendete Emails, Öffnungsrate, Klickrate)

**Implementierung**:
- Nutzt Prisma für Datenbankabfragen
- Berechnet Statistiken in Echtzeit
- Liefert strukturierte Daten für das Dashboard-Frontend

### 2. `/api/admin/system-status.ts`

**Funktion**: Überwachung der Systemkomponenten
- API-Status mit Latenzzeiten
- Datenbank-Status mit Latenzzeiten
- Payment-System-Status
- Email-System-Status

**Implementierung**:
- Führt Gesundheitschecks für jede Komponente durch
- Misst Latenzzeiten für Performance-Überwachung
- Kategorisiert Status als "online", "degraded" oder "offline"

### 3. `/api/admin/events.ts`

**Funktion**: Verwaltung von Events
- Abrufen von Events mit Filtern und Pagination
- Erstellen, Aktualisieren und Löschen von Events
- Berechnung von Event-Statistiken

**Implementierung**:
- CRUD-Operationen für Events
- Berechnung von Teilnahmeraten und anderen Statistiken
- Filterung nach Status, Restaurant und Suchbegriffen

### 4. `/api/admin/email-tracking.ts`

**Funktion**: Tracking von Email-Interaktionen
- Aufzeichnung von Öffnungen und Klicks
- Aggregierte Statistiken für Kampagnen
- Detaillierte Tracking-Daten für Analysen

**Implementierung**:
- Tracking-Pixel für Öffnungen
- Redirect-Links für Klick-Tracking
- Speicherung von Metadaten (User-Agent, IP, Zeitstempel)

## Frontend-Komponenten

### 1. Dashboard-Hauptkomponente (`/src/pages/admin/dashboard.tsx`)

**Funktionen**:
- Anzeige aller Dashboard-Statistiken
- Echtzeit-Aktualisierung von Systemstatus
- Visualisierung von Email- und Event-Daten

**Implementierung**:
- React-Hooks für State-Management
- Fetch-API für Datenabruf
- Responsive UI mit Tailwind CSS

### 2. Email-Statistik-Karte

**Funktionen**:
- Anzeige von Kampagnenstatistiken
- Übersicht über gesendete Emails
- Darstellung von Öffnungs- und Klickraten

**Implementierung**:
- Dynamische Datenvisualisierung
- Tabelle für kürzliche Kampagnen
- Farbkodierte Statusanzeigen

### 3. Events-Übersicht-Karte

**Funktionen**:
- Anzeige von Event-Statistiken
- Übersicht über kommende und vergangene Events
- Darstellung von Teilnahmeraten

**Implementierung**:
- Grid-Layout für Statistik-Kacheln
- Farbkodierte Kategorien
- Links zu detaillierten Event-Ansichten

### 4. Systemstatus-Anzeige

**Funktionen**:
- Echtzeit-Status aller Systemkomponenten
- Visualisierung von Latenzzeiten
- Manuelle Aktualisierungsmöglichkeit

**Implementierung**:
- Status-Indikatoren mit Farbkodierung
- Latenzanzeige für Performance-Monitoring
- Aktualisierungsbutton mit Ladeanimation

## Datenmodelle

### 1. Email-Tracking

```typescript
interface EmailTracking {
  id: string;
  email_id: string;
  batch_id: string;
  campaign_id: string;
  recipient_id: string;
  event_type: 'open' | 'click' | 'bounce';
  timestamp: Date;
  user_agent?: string;
  ip_address?: string;
  metadata?: any;
}
```

### 2. Event-Statistiken

```typescript
interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  avgParticipationRate: number;
}
```

### 3. Email-Statistiken

```typescript
interface EmailStats {
  totalCampaigns: number;
  totalSent: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  recentCampaigns: EmailCampaign[];
}
```

### 4. Systemstatus

```typescript
interface SystemStatus {
  api: { status: string, latency: number | null };
  database: { status: string, latency: number | null };
  payment: { status: string, latency: number | null };
  email: { status: string, latency: number | null };
}
```

## Tests

Für alle implementierten Funktionen wurden Tests erstellt:

1. **Dashboard-Komponententests**
   - Überprüfung der korrekten Darstellung von Daten
   - Test des Ladeverhaltens
   - Überprüfung der Fehlerbehandlung

2. **API-Routentests**
   - Tests für Dashboard-Daten
   - Tests für Systemstatus
   - Tests für Events-API
   - Tests für Email-Tracking

## Authentifizierung und Sicherheit

- Alle Admin-Routen sind mit `withAdminAuth` Middleware geschützt
- Verwendung des `createAdminClient` für privilegierte Supabase-Operationen
- Rollenbasierte Zugriffskontrolle (nur Admin-Benutzer)
- Sichere Handhabung von Umgebungsvariablen

## Bekannte Einschränkungen

- Die Echtzeit-Aktualisierung erfolgt derzeit nur manuell oder bei Seitenladen
- Detaillierte Email-Tracking-Analysen sind auf Kampagnenebene beschränkt
- Systemstatus-Checks können bei langsamen externen Diensten zu Timeouts führen

## Nächste Schritte

- Implementierung von Echtzeit-Benachrichtigungen für Systemstatus-Änderungen
- Erweiterung der Event-Statistiken um Umsatzprognosen
- Integration von A/B-Testing für Email-Kampagnen
- Verbesserung der Visualisierung mit interaktiven Charts
