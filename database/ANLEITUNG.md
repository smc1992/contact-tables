# Anleitung zur Implementierung des Datenbankschemas in Supabase

Diese Anleitung beschreibt die Einrichtung und Optimierung des Datenbankschemas für die Contact Tables-Anwendung in Supabase.

## 1. Zugriff auf Supabase SQL-Editor

1. Melden Sie sich bei [Supabase](https://app.supabase.io) an
2. Wählen Sie Ihr Projekt aus
3. Klicken Sie im linken Menü auf "SQL Editor"
4. Klicken Sie auf "New Query" oder wählen Sie einen leeren Query-Tab

## 2. Schema implementieren

1. Öffnen Sie die Datei `schema.sql` in diesem Verzeichnis
2. Kopieren Sie den gesamten Inhalt
3. Fügen Sie den Inhalt in den SQL-Editor von Supabase ein
4. Klicken Sie auf "Run" oder drücken Sie Strg+Enter (Cmd+Enter auf Mac)

Das Schema enthält:
- Alle Tabellendefinitionen
- Row Level Security (RLS) Policies
- Funktionen und Trigger
- Indizes für Fremdschlüssel

## 3. Datenbankoptimierungen

Folgende Optimierungen wurden für die Datenbank implementiert:

### 3.1 RLS-Policy-Optimierungen

- Alle `auth.uid()`-Aufrufe wurden durch `(select auth.uid())` ersetzt, um wiederholte Auswertungen zu vermeiden
- Mehrfache permissive Policies für dieselbe Rolle und Aktion wurden zusammengeführt
- Policies wurden klar nach Aktionen (SELECT, INSERT, UPDATE, DELETE) getrennt

Diese Optimierungen verbessern die Leistung der Datenbank, besonders bei Tabellen mit vielen Datensätzen.

### 3.2 Indizierung von Fremdschlüsseln

Folgende Fremdschlüssel wurden mit Indizes versehen:
- `admin_activity_logs.admin_id`
- `contact_tables.restaurant_id`
- `favorites.contact_table_id`
- `notifications.user_id`
- `participations.user_id`
- `participations.contact_table_id`
- `partner_requests.admin_id`
- `partner_requests.restaurant_id`
- `ratings.user_id`
- `ratings.contact_table_id`
- `user_activities.user_id`

Diese Indizes verbessern die Leistung von JOIN-Operationen und WHERE-Klauseln, die diese Spalten verwenden.

## 4. Beispieldaten laden (optional)

Wenn Sie Beispieldaten zum Testen laden möchten:
1. Öffnen Sie die Datei `seed.sql` in diesem Verzeichnis
2. Kopieren Sie den Inhalt
3. Erstellen Sie eine neue Query im SQL-Editor
4. Fügen Sie den Inhalt ein und führen Sie ihn aus

## 5. Überprüfen der Installation

Nach der Installation können Sie die Tabellen in der Supabase-Oberfläche überprüfen:
1. Klicken Sie im linken Menü auf "Table Editor"
2. Sie sollten alle erstellten Tabellen sehen:
   - profiles
   - restaurants
   - contact_tables
   - participations
   - favorites
   - notifications
   - ratings
   - user_settings
   - partner_requests

## 6. Storage-Buckets erstellen

Für die Speicherung von Mediendateien sollten Sie folgende Storage-Buckets erstellen:
1. Klicken Sie im linken Menü auf "Storage"
2. Klicken Sie auf "Create a new bucket"
3. Erstellen Sie folgende Buckets:
   - `avatars` - für Profilbilder
   - `restaurant-images` - für Restaurant-Bilder
   - `event-images` - für Bilder von Kontakttischen/Events
   - `documents` - für allgemeine Dokumente

## 7. Hinweise zu Warnungen

### 7.1 Unbenutzte Indizes

Wenn der Supabase-Linter Warnungen über "Unused Index" anzeigt, ist dies normal für eine neue Datenbank. Die Indizes werden erst dann als "benutzt" markiert, wenn Datenbankabfragen ausgeführt werden, die diese Indizes verwenden. Bei wachsender Datenmenge und zunehmender Nutzung werden diese Indizes automatisch vom Abfrageplaner verwendet.
3. Erstellen Sie folgende Buckets:
   - `avatars` (für Profilbilder)
   - `restaurant-images` (für Restaurant-Logos und -Bilder)
   - `event-images` (für Bilder von Kontakttischen)
   - `documents` (für Verträge und andere Dokumente)

## 6. RLS-Policies für Storage-Buckets

Für jeden Bucket sollten Sie entsprechende RLS-Policies einrichten:
1. Klicken Sie auf den Bucket
2. Wählen Sie den Tab "Policies"
3. Klicken Sie auf "Create Policy"
4. Erstellen Sie Policies für Lesen, Schreiben und Löschen basierend auf Benutzerrollen

## 7. Authentifizierungseinstellungen

Stellen Sie sicher, dass die Authentifizierungseinstellungen korrekt konfiguriert sind:
1. Klicken Sie im linken Menü auf "Authentication"
2. Wählen Sie "Settings"
3. Aktivieren Sie die gewünschten Anmeldeanbieter (E-Mail, Google, etc.)
4. Konfigurieren Sie die Weiterleitungs-URLs für Ihre Anwendung

## Fehlerbehebung

Falls Fehler auftreten:
- Überprüfen Sie die Fehlermeldungen im SQL-Editor
- Führen Sie die Befehle einzeln aus, um problematische Stellen zu identifizieren
- Beachten Sie, dass einige Befehle möglicherweise Administratorrechte erfordern

## Nächste Schritte

Nach erfolgreicher Implementierung des Schemas:
1. Integrieren Sie die Supabase-Client-Bibliothek in Ihre Anwendung
2. Erstellen Sie API-Funktionen zum Lesen und Schreiben von Daten
3. Implementieren Sie die Authentifizierung und Autorisierung
4. Testen Sie die Funktionalität mit Beispieldaten
