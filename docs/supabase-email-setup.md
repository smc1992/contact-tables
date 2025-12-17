# Supabase E-Mail-Konfiguration

Diese Anleitung erklärt, wie die E-Mail-Funktionalität in Supabase konfiguriert wird, um sicherzustellen, dass Bestätigungs-E-Mails korrekt versendet werden.

## Voraussetzungen

1. Zugang zum Supabase-Dashboard
2. Administrator-Rechte für das Projekt

## E-Mail-Provider konfigurieren

Standardmäßig verwendet Supabase seinen eigenen E-Mail-Service, der jedoch Einschränkungen haben kann. Für eine zuverlässigere Zustellung sollte ein eigener E-Mail-Provider konfiguriert werden:

1. Gehe zum [Supabase Dashboard](https://app.supabase.io)
2. Wähle dein Projekt aus
3. Navigiere zu "Authentication" > "Email Templates"
4. Klicke auf "Email Settings"
5. Wähle einen E-Mail-Provider (z.B. SendGrid, Mailgun, SMTP)
6. Gib die erforderlichen Anmeldedaten ein

## E-Mail-Templates überprüfen

Die E-Mail-Templates müssen korrekt konfiguriert sein:

1. Gehe zu "Authentication" > "Email Templates"
2. Überprüfe die Templates für:
   - Bestätigungs-E-Mail
   - Magic Link
   - Passwort zurücksetzen
3. Stelle sicher, dass die Templates korrekte Links enthalten, die auf deine Anwendung verweisen

## Wichtige Umgebungsvariablen

Folgende Umgebungsvariablen müssen korrekt gesetzt sein:

```
NEXT_PUBLIC_SITE_URL=https://deine-website.com
```

Diese Variable wird verwendet, um die Redirect-URLs in den E-Mails zu erstellen.

## Fehlerbehebung bei E-Mail-Problemen

Wenn keine E-Mails ankommen:

1. **Überprüfe die Spam-Ordner** - Oft landen Bestätigungs-E-Mails im Spam-Ordner
2. **Prüfe die E-Mail-Provider-Einstellungen** - Stelle sicher, dass der E-Mail-Provider korrekt konfiguriert ist
3. **Überprüfe die Supabase-Logs** - Im Supabase-Dashboard unter "Logs" kannst du sehen, ob E-Mails versendet wurden
4. **Teste die E-Mail-Funktionalität manuell** - Nutze die "Send test email" Funktion im Supabase-Dashboard
5. **Überprüfe die Domain-Verifizierung** - Manche E-Mail-Provider erfordern eine Domain-Verifizierung

## Empfohlene Konfiguration

Für die beste Zustellbarkeit empfehlen wir:

1. Einen eigenen E-Mail-Provider wie SendGrid oder Mailgun zu verwenden
2. SPF- und DKIM-Einträge für die Domain zu konfigurieren
3. Eine verifizierte Absender-Domain zu verwenden
4. E-Mail-Templates zu personalisieren, um Spam-Filter zu vermeiden

## Debugging-Tipps

Wenn du die E-Mail-Funktionalität debuggen möchtest:

1. Aktiviere die erweiterten Logs in Supabase unter "Settings" > "API"
2. Überprüfe die Netzwerk-Anfragen in der Browser-Konsole
3. Teste mit verschiedenen E-Mail-Adressen (z.B. Gmail, Outlook)
4. Überprüfe, ob die `redirectTo`-URL in der Anwendung korrekt gesetzt ist
