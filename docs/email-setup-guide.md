# E-Mail-Konfiguration für Supabase

## Problem
Aktuell werden keine Bestätigungs-E-Mails von Supabase gesendet, obwohl die API-Anfragen erfolgreich sind.

## Ursachen
1. Kein E-Mail-Provider in Supabase konfiguriert
2. Lokale Entwicklungsumgebung mit `http://localhost:3000` als Redirect-URL

## Lösungen

### 1. E-Mail-Provider in Supabase konfigurieren

Supabase unterstützt verschiedene E-Mail-Provider:
- SMTP (eigener E-Mail-Server)
- SendGrid
- Mailgun
- PostMark

#### Konfiguration über Supabase Dashboard:

1. Gehe zum [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt "Contact Tables" aus
3. Navigiere zu "Authentication" > "Email Templates"
4. Klicke auf "Email Settings"
5. Wähle einen E-Mail-Provider und gib die erforderlichen Daten ein:
   - Für SMTP: Server, Port, Benutzername, Passwort
   - Für andere Provider: API-Schlüssel

### 2. Umgebungsvariablen anpassen

Für die Produktionsumgebung:

```
# In .env.production oder in Netlify Environment Variables
NEXT_PUBLIC_SITE_URL=https://contact-tables.org
```

Für die lokale Entwicklung:

```
# In .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. E-Mail-Templates anpassen

Nach der Konfiguration des E-Mail-Providers kannst du die E-Mail-Templates im Supabase Dashboard anpassen:

1. Gehe zu "Authentication" > "Email Templates"
2. Passe die Templates für "Bestätigung", "Einladung", "Passwort zurücksetzen" usw. an

## Temporäre Lösung für Tests

Für Testzwecke kannst du einen temporären E-Mail-Dienst wie [Mailosaur](https://mailosaur.com/) oder [Mailtrap](https://mailtrap.io/) verwenden, um E-Mails in einer Sandbox zu testen, ohne echte E-Mails zu versenden.

## Überprüfung der E-Mail-Konfiguration

Nach der Konfiguration des E-Mail-Providers kannst du die E-Mail-Funktionalität testen:

```bash
# Bestätigungs-E-Mail senden
node scripts/send-confirmation-email.js test@example.com
```

## Hinweis für die Produktionsumgebung

Stelle sicher, dass in der Produktionsumgebung (Netlify) die Umgebungsvariable `NEXT_PUBLIC_SITE_URL` korrekt auf die Produktions-URL gesetzt ist.
