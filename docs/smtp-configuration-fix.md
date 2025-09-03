# SMTP-Konfiguration und E-Mail-Versand - Fehlerbehebung

## Zusammenfassung des Problems

Der E-Mail-Versand im Email-Builder schlug mit dem Fehler "SMTP configuration incomplete" fehl. Nach Untersuchung wurden folgende Probleme identifiziert:

1. Der `createAdminClient()` in `src/utils/supabase/server.ts` hatte einen Fallback zum Anon-Key, wenn der Service Role Key nicht verfügbar war
2. Die E-Mail-Versand-API hatte keine ausreichende Fehlerbehandlung beim Laden der SMTP-Einstellungen
3. Es gab keine Überprüfung, ob der Admin-Client korrekt erstellt wurde und Zugriff auf die `system_settings`-Tabelle hatte

## Vorgenommene Änderungen

### 1. Verbesserung der `createAdminClient()`-Funktion

Die Funktion wurde angepasst, um den Fallback auf den Anon-Key zu entfernen, da dieser nicht die notwendigen Berechtigungen für den Zugriff auf geschützte Tabellen hat:

```typescript
// Vorher
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Admin Supabase configuration is missing:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  });
  
  // Statt sofort einen Fehler zu werfen, versuchen wir einen Client mit eingeschränkten Rechten zu erstellen
  if (supabaseUrl) {
    console.warn('WARNUNG: SUPABASE_SERVICE_ROLE_KEY fehlt. Erstelle eingeschränkten Admin-Client mit Anon-Key.');
    try {
      // Fallback zum Anon-Key, der eingeschränkte Rechte hat
      return createServerClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          cookies: {
            get() { return undefined; },
            set() {},
            remove() {},
          },
        }
      );
    } catch (fallbackError) {
      console.error('Fehler beim Erstellen des Fallback-Admin-Clients:', fallbackError);
      throw new Error('Admin Supabase configuration is missing. SUPABASE_SERVICE_ROLE_KEY muss in den Umgebungsvariablen gesetzt sein.');
    }
  } else {
    throw new Error('Admin Supabase configuration is missing. SUPABASE_SERVICE_ROLE_KEY und NEXT_PUBLIC_SUPABASE_URL müssen in den Umgebungsvariablen gesetzt sein.');
  }
}

// Nachher
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Admin Supabase configuration is missing:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  });
  
  // Kein Fallback mehr zum Anon-Key, da dies zu Berechtigungsproblemen führt
  // Stattdessen werfen wir einen klaren Fehler
  throw new Error('Admin Supabase configuration is missing. SUPABASE_SERVICE_ROLE_KEY und NEXT_PUBLIC_SUPABASE_URL müssen in den Umgebungsvariablen gesetzt sein.');
}
```

### 2. Verbesserte Fehlerbehandlung in der E-Mail-Versand-API

Die API-Route `/api/admin/emails/send.ts` wurde mit zusätzlichen Überprüfungen und Fehlerbehandlung erweitert:

```typescript
// Überprüfe, ob der Admin-Client korrekt erstellt wurde
if (!adminSupabase) {
  console.error('Admin-Client konnte nicht erstellt werden');
  return res.status(500).json({ 
    ok: false, 
    message: 'Admin-Client konnte nicht erstellt werden. Bitte überprüfen Sie die Umgebungsvariablen.' 
  });
}

// Teste, ob der Admin-Client Zugriff auf die system_settings-Tabelle hat
try {
  const { count, error: testError } = await adminSupabase
    .from('system_settings')
    .select('*', { count: 'exact', head: true });

  if (testError) {
    console.error('Admin-Client hat keinen Zugriff auf system_settings:', testError);
    return res.status(500).json({ 
      ok: false, 
      message: 'Keine Berechtigung für system_settings-Tabelle. Bitte überprüfen Sie die RLS-Richtlinien.' 
    });
  }

  console.log('Admin-Client hat Zugriff auf system_settings. Anzahl Einträge:', count);
} catch (testError) {
  console.error('Fehler beim Testen des Admin-Clients:', testError);
}

// Verbesserte Fehlerbehandlung beim Laden der SMTP-Einstellungen
if (settingsError) {
  console.error('Fehler beim Abrufen der SMTP-Einstellungen:', settingsError);
  return res.status(500).json({ 
    ok: false, 
    message: `Fehler beim Abrufen der SMTP-Einstellungen: ${settingsError.message}` 
  });
} else {
  console.log('SMTP-Einstellungen erfolgreich abgerufen:', settings ? 'Ja' : 'Nein');
  if (!settings) {
    console.error('Keine SMTP-Einstellungen in der Datenbank gefunden');
  }
}
```

## Wichtige Hinweise

1. Der `SUPABASE_SERVICE_ROLE_KEY` muss in allen Umgebungen (lokal und in Produktion) korrekt gesetzt sein
2. Die RLS-Richtlinien für die `system_settings`-Tabelle müssen den Zugriff für den Service Role Key erlauben
3. Die SMTP-Einstellungen müssen in der Admin-Oberfläche konfiguriert sein oder als Umgebungsvariablen bereitgestellt werden

## Testen

Um zu testen, ob die E-Mail-Funktion korrekt funktioniert:

1. Stellen Sie sicher, dass der `SUPABASE_SERVICE_ROLE_KEY` in der `.env`-Datei korrekt gesetzt ist
2. Überprüfen Sie die SMTP-Einstellungen in der Admin-Oberfläche unter `/admin/settings`
3. Testen Sie den E-Mail-Versand im Email-Builder unter `/admin/email-builder`

## Weitere Empfehlungen

1. Überwachen Sie die Logs der E-Mail-Versand-API, um mögliche Probleme frühzeitig zu erkennen
2. Fügen Sie eine Validierung der SMTP-Einstellungen in der Admin-Oberfläche hinzu, bevor sie gespeichert werden
3. Implementieren Sie einen regelmäßigen Test der SMTP-Verbindung, um sicherzustellen, dass die Konfiguration gültig bleibt
