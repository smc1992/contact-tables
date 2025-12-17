# API-Endpunkte Dokumentation

## Authentifizierung und Benutzerregistrierung

### Benutzerregistrierung
- **Endpunkt:** `/api/auth/register-user/`
- **Methode:** POST
- **Beschreibung:** Registriert einen neuen Benutzer mit Restaurantdaten
- **Wichtig:** Der Endpunkt muss mit einem abschließenden Schrägstrich (`/`) aufgerufen werden
- **Anfrageparameter:**
  ```json
  {
    "email": "string",
    "password": "string",
    "firstName": "string",
    "lastName": "string",
    "restaurantName": "string",
    "role": "string (optional, default: 'customer')",
    "phone": "string (optional)",
    "address": "string (optional)",
    "postalCode": "string (optional)",
    "city": "string (optional)",
    "description": "string (optional)",
    "cuisine": "string (optional)",
    "capacity": "number (optional)",
    "openingHours": "string (optional)"
  }
  ```
- **Erfolgsantwort:**
  ```json
  {
    "success": true,
    "message": "Benutzer erfolgreich registriert",
    "userId": "string",
    "role": "string"
  }
  ```
- **Fehlerantwort:**
  ```json
  {
    "error": "string",
    "details": "string"
  }
  ```

## Bekannte Probleme und Lösungen

### 400 Bad Request bei API-Aufrufen
Wenn API-Endpunkte mit einem 400 Bad Request fehlschlagen, überprüfen Sie:
1. Ob der Endpunkt mit einem abschließenden Schrägstrich (`/`) aufgerufen wird
2. Ob alle erforderlichen Felder in der Anfrage vorhanden sind
3. Ob die Datentypen korrekt sind

### JavaScript-Ressourcen Fehler in der Konsole
Fehler wie `net::ERR_FILE_NOT_FOUND` für Dateien wie `utils.js`, `extensionState.js` oder `heuristicsRedefinitions.js` sind in der Regel Chrome DevTools-bezogene Fehler und beeinträchtigen die Anwendung nicht. Diese Fehler treten nur auf, wenn die DevTools geöffnet sind und können ignoriert werden.

## Wichtige Hinweise für Entwickler

1. **API-Endpunkte:** Alle API-Endpunkte sollten konsequent entweder mit oder ohne abschließenden Schrägstrich implementiert werden. In diesem Projekt verwenden wir den abschließenden Schrägstrich.

2. **Umgebungsvariablen:** Stellen Sie sicher, dass alle erforderlichen Umgebungsvariablen konfiguriert sind:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `DATABASE_URL`
   - `DIRECT_URL`

3. **Supabase-Client:** Verwenden Sie immer die zentrale `createClient`-Funktion aus `utils/supabase/server.ts` für serverseitige Supabase-Interaktionen.

## Digistore24

### Checkout-URL für Restaurant (mit Zuordnung)
- **Endpunkt:** `/api/payments/digistore-checkout-url`
- **Methode:** GET
- **Beschreibung:** Generiert eine Digistore-Checkout-URL mit `custom=<restaurantId>`, sodass Bestellungen einem Restaurant zugeordnet werden.
- **Query-Parameter:**
  - `type` (optional): `monthly` | `yearly` | `default`
- **Antwort:** `{ url: string }`

### Pläne aus Digistore laden (Fallback möglich)
- **Endpunkt:** `/api/digistore/plans`
- **Methode:** GET
- **Beschreibung:** Liest verfügbare Produkte/Pläne aus Digistore. Fällt auf ENV-Links zurück, wenn API nicht verfügbar ist.
- **Antwort:** `{ plans: Array<{ id, name, url, price?, currency? }> }`

### Verify-Endpoint: Zahlungsstatus prüfen und optional freischalten
- **Endpunkt:** `/api/digistore/verify`
- **Methode:** GET
- **Beschreibung:** Prüft via Digistore API (Transaktionen + getPurchase), ob eine Bestellung bezahlt ist. Optional kann bei bestätigter Zahlung das Restaurant freigeschaltet werden.
- **Authentifizierung:** Erfordert eingeloggten Benutzer mit Rolle `ADMIN` oder `STAFF`.
- **Query-Parameter:**
  - `restaurantId` (optional): bevorzugter Identifikator (kommt aus `custom` im Checkout-Link)
  - `email` (optional): Fallback-Identifikator (Käufer-E-Mail)
  - `purchase_id` (optional): direkte Abfrage einer konkreten Bestellung
  - `currency` (optional): z. B. `EUR`
  - `update` (optional): `1` oder `true` ⇒ bei bestätigter Zahlung Restaurant auf `ACTIVE` setzen
- **Erfolgsantwort:**
  ```json
  {
    "result": "success",
    "status": {
      "isPaid": true,
      "billingStatus": "paid",
      "billingStatusMsg": "Zahlung bestätigt",
      "billingType": "single_payment",
      "amount": 10.00,
      "currency": "EUR",
      "paymentMethod": "visa"
    },
    "matched": {
      "purchaseId": "ZMZV26HF",
      "productId": 640621,
      "buyerEmail": "kunde@example.com",
      "custom": "<restaurantId>"
    },
    "urls": {
      "receiptUrl": "https://digistore24.com/receipt/...",
      "renewUrl": "https://digistore24.com/renew/..."
    }
  }
  ```

### Webhook: Zahlungsereignisse verarbeiten
- **Endpunkt:** `/api/payments/digistore-webhook`
- **Methode:** POST (Digistore24 S2S/IPN)
- **Beschreibung:** Verifiziert `sha_sign` und setzt je nach Ereignis den Vertragsstatus (z. B. `ACTIVE` bei Zahlung, `CANCELLED` bei Rückerstattung/Kündigung).
- **Konfiguration:** Digistore Backoffice → S2S Postback URL auf diesen Endpunkt setzen, Secret: `DIGISTORE_POSTBACK_SECRET`.
