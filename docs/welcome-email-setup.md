# Einrichtung der automatischen Willkommens-E-Mails mit Supabase Edge Functions

Diese Dokumentation beschreibt, wie die automatischen Willkommens-E-Mails für neue Kunden mit Supabase Edge Functions eingerichtet werden.

## Übersicht

Das System sendet automatisch eine Willkommens-E-Mail an jeden neu registrierten Benutzer mit der Rolle "CUSTOMER". Die E-Mail-Vorlage kann im Admin-Bereich unter "E-Mail-Vorlagen" verwaltet werden.

Die Implementierung nutzt Supabase Edge Functions, um die E-Mail-Verarbeitung direkt in der Supabase-Infrastruktur durchzuführen, was die Zuverlässigkeit und Skalierbarkeit verbessert.

## Einrichtungsschritte

### 1. Umgebungsvariablen für Supabase konfigurieren

Fügen Sie die folgenden Umgebungsvariablen zu Ihrer Supabase-Projektkonfiguration hinzu:

```bash
supabase secrets set INTERNAL_API_SECRET=ein-sicherer-geheimer-schlüssel
supabase secrets set SITE_URL=https://ihre-domain.de
```

### 2. Standard-Willkommens-E-Mail-Vorlage erstellen

Führen Sie das folgende Skript aus, um die Standard-Willkommens-E-Mail-Vorlage zu erstellen:

```bash
node scripts/create-welcome-email-template.js
```

### 3. Supabase Edge Function bereitstellen

1. Navigieren Sie zum Projektverzeichnis und führen Sie den folgenden Befehl aus:

```bash
supabase functions deploy welcome-email
```

2. Aktivieren Sie die Edge Function in der Supabase-Konsole unter "Edge Functions".

### 4. Supabase-Datenbank-Trigger einrichten

1. Öffnen Sie die Supabase-Konsole und navigieren Sie zum SQL-Editor
2. Führen Sie die SQL-Befehle aus der Datei `supabase/functions/welcome-email/trigger.sql` aus
3. Konfigurieren Sie die folgenden Parameter in der Supabase-Konsole unter SQL-Editor > Configuration:

```sql
-- Setzen Sie diese Werte entsprechend Ihrer Umgebung
ALTER SYSTEM SET app.edge_function_url = 'https://ihre-supabase-projekt-id.supabase.co/functions/v1';
ALTER SYSTEM SET app.edge_function_key = 'ihr-supabase-anon-key-oder-service-key';
```

4. Stellen Sie sicher, dass die `net.http_post`-Funktion in Ihrer Supabase-Instanz aktiviert ist

### 5. Edge Function testen

Um zu überprüfen, ob die Edge Function korrekt funktioniert, können Sie einen Test mit curl durchführen:

```bash
curl -X POST https://ihre-supabase-projekt-id.supabase.co/functions/v1/welcome-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ihr-supabase-anon-key" \
  -d '{"type":"INSERT","table":"profiles","record":{"id":"test-user-id","role":"CUSTOMER"}}'
```

## Funktionsweise

1. Wenn ein neuer Benutzer registriert wird, löst Supabase einen Datenbank-Trigger aus
2. Der Trigger ruft die Edge Function `welcome-email` auf
3. Die Edge Function prüft, ob der Benutzer die Rolle "CUSTOMER" hat
4. Wenn ja, lädt die Edge Function die E-Mail-Vorlage und SMTP-Einstellungen
5. Die Edge Function erstellt eine E-Mail-Kampagne und sendet die E-Mail über die bestehende API

## Vorteile der Edge Functions

- **Skalierbarkeit**: Edge Functions werden in der Supabase-Infrastruktur ausgeführt und skalieren automatisch
- **Zuverlässigkeit**: Keine Abhängigkeit von externen Webhooks oder Netzwerkproblemen
- **Sicherheit**: Direkter Zugriff auf die Datenbank ohne Umwege über externe APIs
- **Einfachere Wartung**: Alles in einem Supabase-Projekt verwaltet

## Fehlerbehebung

### Die Willkommens-E-Mail wird nicht gesendet

1. Überprüfen Sie die Logs der Edge Function in der Supabase-Konsole
2. Stellen Sie sicher, dass die Umgebungsvariablen korrekt konfiguriert sind
3. Überprüfen Sie, ob der Datenbank-Trigger korrekt eingerichtet ist
4. Stellen Sie sicher, dass die E-Mail-Vorlage "Willkommen bei Contact Tables" existiert

### SMTP-Fehler

1. Überprüfen Sie die SMTP-Einstellungen in den Systemeinstellungen
2. Stellen Sie sicher, dass der SMTP-Server erreichbar ist
3. Überprüfen Sie die Authentifizierungsdaten für den SMTP-Server
