# Supabase Umgebungsvariablen Konfiguration

Diese Anleitung erklärt, wie die erforderlichen Umgebungsvariablen für die Supabase-Integration konfiguriert werden.

## Erforderliche Umgebungsvariablen

Für die korrekte Funktion der Anwendung, insbesondere für die Benutzerregistrierung und Admin-Funktionen, müssen folgende Umgebungsvariablen konfiguriert sein:

```
NEXT_PUBLIC_SUPABASE_URL=https://deine-projekt-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Lokale Entwicklung

1. Erstelle eine Datei `.env.local` im Hauptverzeichnis des Projekts
2. Kopiere die folgenden Zeilen und füge deine Supabase-Anmeldedaten ein:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://deine-projekt-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key

# Website URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Starte den Entwicklungsserver neu mit `npm run dev`

## Supabase-Anmeldedaten finden

1. Gehe zum [Supabase Dashboard](https://app.supabase.io)
2. Wähle dein Projekt aus
3. Gehe zu "Settings" > "API"
4. Unter "Project API keys" findest du:
   - `anon public`: Dies ist dein `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret`: Dies ist dein `SUPABASE_SERVICE_ROLE_KEY`
5. Die Projekt-URL (`NEXT_PUBLIC_SUPABASE_URL`) findest du unter "Settings" > "API" > "Project URL"

## Produktionsumgebung (Netlify)

Für die Produktionsumgebung müssen die Umgebungsvariablen in Netlify konfiguriert werden:

1. Gehe zum Netlify Dashboard
2. Wähle dein Projekt aus
3. Gehe zu "Site settings" > "Build & deploy" > "Environment variables"
4. Füge die gleichen Umgebungsvariablen hinzu, aber setze `NEXT_PUBLIC_SITE_URL` auf die tatsächliche URL deiner Website

## Fehlerbehebung

Wenn du Fehler bei der Benutzerregistrierung oder anderen Supabase-bezogenen Funktionen siehst:

1. Überprüfe, ob alle Umgebungsvariablen korrekt gesetzt sind
2. Stelle sicher, dass der `SUPABASE_SERVICE_ROLE_KEY` korrekt ist und die erforderlichen Berechtigungen hat
3. Überprüfe die Server-Logs auf spezifische Fehlermeldungen

**Wichtig**: Der `SUPABASE_SERVICE_ROLE_KEY` hat umfangreiche Berechtigungen. Teile ihn niemals öffentlich und füge ihn nicht in den Quellcode ein.
