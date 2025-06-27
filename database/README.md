# Contact Tables Datenbankschema

Dieses Verzeichnis enthält SQL-Dateien für die Einrichtung und Initialisierung der Supabase-Datenbank für die Contact Tables Anwendung.

## Dateien

- `schema.sql` - Enthält alle Tabellendefinitionen, RLS-Policies und Trigger
- `seed.sql` - Enthält Beispieldaten zum Testen der Anwendung

## Datenbankstruktur

Die Datenbank besteht aus folgenden Tabellen:

1. **profiles** - Benutzerprofile mit persönlichen Informationen
2. **restaurants** - Restaurant-Informationen mit Status-Tracking (PENDING, APPROVED, ACTIVE)
3. **contact_tables** - Kontakttische/Events, die von Restaurants erstellt werden
4. **participations** - Teilnahmen von Benutzern an Kontakttischen
5. **favorites** - Favorisierte Kontakttische der Benutzer
6. **notifications** - Benachrichtigungen für Benutzer
7. **ratings** - Bewertungen für Kontakttische
8. **user_settings** - Benutzereinstellungen für Benachrichtigungen und Datenschutz
9. **partner_requests** - Partneranfragen für Restaurant-Registrierungen

## Installation

Um dieses Schema in Ihrer Supabase-Datenbank zu installieren:

1. Öffnen Sie die [Supabase Dashboard](https://app.supabase.io)
2. Wählen Sie Ihr Projekt aus
3. Gehen Sie zum SQL-Editor
4. Kopieren Sie den Inhalt von `schema.sql` und führen Sie ihn aus
5. Optional: Kopieren Sie den Inhalt von `seed.sql` und führen Sie ihn aus, um Beispieldaten zu laden

## Sicherheit

Das Schema verwendet Row Level Security (RLS), um sicherzustellen, dass:

- Benutzer nur ihre eigenen Daten bearbeiten können
- Restaurants nur ihre eigenen Kontakttische verwalten können
- Öffentliche Daten für alle sichtbar sind
- Sensible Daten geschützt sind

## Automatisierung

Das Schema enthält Trigger für:

- Automatische Aktualisierung von Zeitstempeln (`updated_at`)
- Aktualisierung der Teilnehmerzahlen bei Kontakttischen
- Automatische Erstellung von Profilen und Einstellungen nach der Benutzerregistrierung
- Automatische Erstellung von Restaurant-Einträgen und Partneranfragen für Restaurant-Benutzer
