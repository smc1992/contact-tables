# Netlify-Umgebungsvariablen für E-Mail-Funktionalität

Um sicherzustellen, dass die E-Mail-Funktionalität auch in der Produktionsumgebung auf Netlify korrekt funktioniert, müssen die folgenden Umgebungsvariablen in den Netlify-Einstellungen konfiguriert werden:

## Erforderliche Umgebungsvariablen

1. **SUPABASE_SERVICE_ROLE_KEY**
   - Wert: `[Ihr Service Role Key aus dem Supabase Dashboard]`
   - Beschreibung: Wird benötigt, um RLS-Richtlinien zu umgehen und Admin-Operationen durchzuführen

2. **NEXT_PUBLIC_SUPABASE_URL**
   - Wert: `[Ihre Supabase-Projekt-URL]`
   - Beschreibung: Die URL Ihres Supabase-Projekts

3. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Wert: `[Ihr Supabase Anon Key]`
   - Beschreibung: Der anonyme Schlüssel für Ihren Supabase-Client

4. **EMAIL_SERVER_HOST**
   - Wert: `[Ihr SMTP-Server]`
   - Beschreibung: Der SMTP-Server für den E-Mail-Versand

5. **EMAIL_SERVER_PORT**
   - Wert: `[Ihr SMTP-Port]`
   - Beschreibung: Der Port für den SMTP-Server (z.B. 587 oder 465)

6. **EMAIL_SERVER_USER**
   - Wert: `[Ihr SMTP-Benutzername]`
   - Beschreibung: Der Benutzername für die SMTP-Authentifizierung

7. **EMAIL_SERVER_PASSWORD**
   - Wert: `[Ihr SMTP-Passwort]`
   - Beschreibung: Das Passwort für die SMTP-Authentifizierung

8. **EMAIL_FROM**
   - Wert: `[Ihre Absender-E-Mail-Adresse]`
   - Beschreibung: Die E-Mail-Adresse, von der aus E-Mails gesendet werden

## Anleitung zum Hinzufügen der Umgebungsvariablen in Netlify

1. Melden Sie sich bei Netlify an und navigieren Sie zu Ihrem Projekt
2. Klicken Sie auf "Site settings" (Seiteneinstellungen)
3. Wählen Sie "Environment variables" (Umgebungsvariablen) aus dem Menü
4. Klicken Sie auf "Add a variable" (Variable hinzufügen)
5. Fügen Sie jede der oben aufgeführten Variablen hinzu
6. Klicken Sie auf "Deploy site" (Seite bereitstellen), um die Änderungen zu übernehmen

## Überprüfung der Konfiguration

Nach der Bereitstellung können Sie die E-Mail-Funktionalität in der Produktionsumgebung testen, indem Sie:

1. Zur Admin-Oberfläche navigieren
2. Den Email-Builder öffnen
3. Eine Test-E-Mail erstellen und senden
4. Überprüfen, ob die E-Mail erfolgreich gesendet wurde

Bei Problemen überprüfen Sie die Netlify-Logs auf Fehlermeldungen im Zusammenhang mit Supabase oder dem E-Mail-Versand.
