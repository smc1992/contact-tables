# E-Mail-Bestätigungs-Edge-Function

Diese Supabase Edge Function sendet Bestätigungs-E-Mails über SMTP für verschiedene Authentifizierungsaktionen wie Registrierung, Passwort-Zurücksetzung usw.

## Konfiguration

Vor der Bereitstellung müssen folgende Umgebungsvariablen gesetzt werden:

```bash
supabase secrets set SMTP_HOSTNAME="smtp.ionos.de" SMTP_PORT="465" SMTP_USERNAME="dein_benutzername" SMTP_PASSWORD="dein_passwort" SMTP_FROM="info@contact-tables.org" SITE_URL="https://contact-tables.org"
```

## Bereitstellung

```bash
supabase functions deploy send-email-confirmation
```

## Verwendung

Die Funktion kann über einen POST-Request aufgerufen werden:

```typescript
const { data, error } = await supabase.functions.invoke('send-email-confirmation', {
  body: {
    to: 'benutzer@example.com',
    token: 'token123',
    tokenHash: 'hash123',
    type: 'signup',
    redirectTo: 'https://contact-tables.org/auth/callback'
  }
})
```

## Unterstützte E-Mail-Typen

- `signup`: Registrierungsbestätigung
- `recovery`: Passwort-Zurücksetzung
- Andere Typen werden mit einer generischen Bestätigungsnachricht behandelt
