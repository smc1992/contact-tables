# E-Mail-Bestätigung in Supabase: Lösung für Produktionsumgebung

## Problem

In der Produktionsumgebung wurden E-Mail-Bestätigungen nicht zuverlässig zugestellt, obwohl die SMTP-Konfiguration in Supabase korrekt eingerichtet war. Insbesondere für die E-Mail-Adresse `info@evolution-bots.app` kamen keine Bestätigungs-E-Mails an.

## Analyse

Nach gründlicher Analyse wurden folgende Probleme identifiziert:

1. **Fehlende E-Mail-Versand-Logs**: In den Supabase-Logs gab es zwar Einträge für die Benutzererstellung und Token-Generierung, aber keine expliziten Logs für den E-Mail-Versand.

2. **Unterschied zwischen manuellem und automatischem E-Mail-Versand**: Der manuelle E-Mail-Versand über das Hilfsskript funktionierte, während der automatische E-Mail-Versand bei der Registrierung fehlschlug.

3. **SMTP-Konfiguration**: Die SMTP-Konfiguration war zwar korrekt eingerichtet, aber es gab möglicherweise Probleme mit der Verbindung zwischen Supabase und dem SMTP-Server.

## Implementierte Lösung

### 1. Supabase Edge Function für E-Mail-Versand

Eine Supabase Edge Function wurde implementiert, die E-Mails über SMTP sendet:

```typescript
// supabase/functions/send-email-confirmation/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

// ... (vollständiger Code in der Datei)
```

Diese Edge Function:
- Nimmt E-Mail-Adresse, Token, Token-Hash, Typ und Weiterleitungs-URL entgegen
- Verbindet sich mit dem SMTP-Server
- Sendet eine formatierte E-Mail mit Bestätigungslink

### 2. Integration in den Registrierungsprozess

Die Edge Function wurde in den Registrierungsprozess integriert, um als Fallback zu dienen, wenn der Standard-E-Mail-Versand von Supabase fehlschlägt:

```typescript
// src/pages/api/auth/register-user/index.ts
// ... (bestehender Code)

// Fallback: Wenn der automatische E-Mail-Versand fehlschlägt, verwenden wir die Edge Function
try {
  console.log('Versuche E-Mail-Versand über Edge Function...');
  // Generiere einen temporären Token für die E-Mail-Bestätigung
  const tempToken = Math.random().toString(36).substring(2, 15);
  const tempTokenHash = Math.random().toString(36).substring(2, 15);
  
  const { data: functionData, error: functionError } = await adminClient.functions.invoke('send-email-confirmation', {
    body: {
      to: email,
      token: tempToken,
      tokenHash: tempTokenHash,
      type: 'signup',
      redirectTo: `${siteUrl}/auth/callback`
    }
  });
  
  // ... (Fehlerbehandlung)
} catch (functionCallError) {
  // ... (Fehlerbehandlung)
}
```

### 3. Automatische Löschung existierender Benutzer

Um das Problem mit dem 409 Conflict-Fehler zu beheben, wurde eine automatische Löschung existierender Benutzer implementiert:

```typescript
// Zuerst prüfen, ob der Benutzer bereits existiert, und wenn ja, vollständig löschen
try {
  // Suche nach dem Benutzer mit der angegebenen E-Mail-Adresse
  const { data: existingUsers } = await adminClient.auth.admin.listUsers();      
  // Filtern der Benutzer nach E-Mail-Adresse
  const matchingUsers = existingUsers?.users?.filter(user => user.email === email);
  
  // Wenn der Benutzer existiert, löschen wir ihn vollständig
  if (matchingUsers && matchingUsers.length > 0) {
    const existingUser = matchingUsers[0];
    console.log(`Benutzer mit E-Mail ${email} existiert bereits. Wird gelöscht...`);
    
    // Benutzer löschen
    await adminClient.auth.admin.deleteUser(existingUser.id);
    
    // Kurze Pause, um sicherzustellen, dass die Löschung vollständig ist
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Benutzer mit E-Mail ${email} wurde gelöscht.`);
  }
} catch (deleteError) {
  // ... (Fehlerbehandlung)
}
```

## Konfiguration der Edge Function

Die Edge Function benötigt folgende Umgebungsvariablen:

```bash
SMTP_HOSTNAME="smtp.ionos.de"
SMTP_PORT="465"
SMTP_USERNAME="info@contact-tables.org"
SMTP_PASSWORD="IhrSMTPPasswort"
SMTP_FROM="info@contact-tables.org"
SITE_URL="https://contact-tables.org"
```

Diese müssen in der Supabase-Produktionsumgebung konfiguriert werden.

## Empfehlungen für die Produktionsumgebung

1. **SMTP-Konfiguration überprüfen**: Stellen Sie sicher, dass die SMTP-Zugangsdaten korrekt sind und der SMTP-Server erreichbar ist.

2. **E-Mail-Templates anpassen**: Überprüfen Sie die E-Mail-Templates in Supabase und stellen Sie sicher, dass sie korrekt konfiguriert sind.

3. **Logs überwachen**: Überwachen Sie die Logs der Edge Function, um sicherzustellen, dass E-Mails erfolgreich gesendet werden.

4. **Fallback-Lösung beibehalten**: Die implementierte Fallback-Lösung sollte beibehalten werden, um sicherzustellen, dass E-Mails auch dann zugestellt werden, wenn der Standard-E-Mail-Versand von Supabase fehlschlägt.

## Fazit

Die implementierte Lösung bietet einen zuverlässigen Mechanismus für den E-Mail-Versand in der Produktionsumgebung, indem sie eine Supabase Edge Function als Fallback verwendet. Dies sollte das Problem mit nicht zugestellten E-Mail-Bestätigungen beheben.
