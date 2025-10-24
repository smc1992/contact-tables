# Secrets und Umgebungsvariablen – Einrichtung und Betrieb

Diese Datei fasst alle relevanten Secrets und Umgebungsvariablen zusammen, erklärt, wo sie herkommen, wie man sie sicher erstellt, und wie sie im Projekt eingesetzt werden (lokal und Produktion).

## Schnellübersicht: .env.local Vorlage
Kopiere den folgenden Block in eine neue Datei `.env.local` (lokal) oder in die Environment-Settings deiner Produktionsumgebung (z. B. Netlify). Ersetze alle Platzhalter mit echten Werten.

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<dein-projekt>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret>
DATABASE_URL=<supabase-connection-string>
DIRECT_URL=<supabase-direct-connection-string>

# Öffentliche Website/App URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WEBSITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Digistore24
NEXT_PUBLIC_DIGISTORE_PRODUCT_URL=https://www.digistore24.com/product/<produkt-id>
DIGISTORE_POSTBACK_SECRET=<starker-geheimer-string>

# Stripe
STRIPE_PUBLIC_KEY=<stripe-public-key>
STRIPE_SECRET_KEY=<stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-signing-secret>
STRIPE_BASIC_PLAN_PRICE_ID=<price_...>
STRIPE_STANDARD_PLAN_PRICE_ID=<price_...>
STRIPE_PREMIUM_PLAN_PRICE_ID=<price_...>
# Für create-checkout (falls genutzt)
STRIPE_RESTAURANT_PRICE_ID=<price_...>
STRIPE_USER_PRICE_ID=<price_...>

# SMTP / E-Mail
EMAIL_SERVER_HOST=<smtp-host>
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=<smtp-user>
EMAIL_SERVER_PASSWORD=<smtp-password>
EMAIL_FROM="Contact Tables <no-reply@deinedomain.de>"
CONTACT_EMAIL=kontakt@deinedomain.de
ADMIN_EMAIL=admin@deinedomain.de

# Cloudinary (Medien-Uploads)
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_UPLOAD_PRESET=<upload-preset>
# Optional öffentlich (wird an manchen Stellen verwendet)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud-name>

# Karten / Geocoding
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<google-maps-api-key>
OPENCAGE_API_KEY=<opencage-api-key>

# Interne Sicherheits- und Integrations-Keys
CRON_SECRET=<starker-geheimer-string>
ADMIN_API_TOKEN=<starker-geheimer-string>
INTERNAL_API_SECRET=<starker-geheimer-string>
SUPABASE_WEBHOOK_SECRET=<starker-geheimer-string>

# Weitere Konfigurationen
NEXT_PUBLIC_SUPABASE_COOKIE_NAME=contact-tables-auth
NETLIFY=false
NEXT_STANDALONE=false
SITE_URL=https://deine-produktions-url.de
```

Hinweis: Variablen mit `NEXT_PUBLIC_…` sind clientseitig sichtbar und sollten keine echten Secrets enthalten. Alle anderen Keys gelten als vertraulich.

---

## Digistore24
- Benötigt:
  - `NEXT_PUBLIC_DIGISTORE_PRODUCT_URL` (Öffentlicher Checkout-Link)
  - `DIGISTORE_POSTBACK_SECRET` (Secret zur `sha_sign`-Verifikation)
  - `DIGISTORE_API_KEY` (Server-seitig; API-Zugriff auf Produkte/Pläne)
- Optional (für zwei Pläne im Dashboard):
  - `NEXT_PUBLIC_DIGISTORE_PLAN_BASIC_URL` (Checkout-Link „Basis“)
  - `NEXT_PUBLIC_DIGISTORE_PLAN_PREMIUM_URL` (Checkout-Link „Premium“)
- Secret erzeugen:
  - OpenSSL: `openssl rand -hex 32` (64 Hex-Zeichen)
  - Node.js: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Konfiguration in Digistore24 Backoffice:
  - IPN/S2S Postback aktivieren und URL setzen: `https://<deine-domain>/api/payments/digistore-webhook`
  - Secret/Passphrase setzen (gleicher Wert wie `DIGISTORE_POSTBACK_SECRET`)
  - Eventauswahl: mindestens `on_payment` (Zahlung bestätigt)
- Checkout-Link erweitern:
  - Alle Checkout-Links um `?custom=<restaurantId>` erweitern, damit das Restaurant im Webhook korrekt zugeordnet wird.
- Signatur-Verifikation (implementiert):
  - `sha_sign` per SHA-512 über alle nicht-leeren, alphabetisch sortierten Parameter, jeweils `UPPERCASE_KEY=value + secret` concatenated; Vergleich mit gesendeter `sha_sign` (uppercase Hex).
- API-Hinweis:
  - Produkte/Pläne werden, falls möglich, per Digistore API geladen; andernfalls greift ein Fallback auf die obigen Plan-URLs.
- Test:
  - Verbindungstest im Digistore24-Backend ausführen, Logs in deiner App prüfen.

## Stripe
- Benötigt:
  - `STRIPE_PUBLIC_KEY` (Client)
  - `STRIPE_SECRET_KEY` (Server)
  - `STRIPE_WEBHOOK_SECRET` (Signaturprüfung der Webhooks)
  - Preis-IDs: `STRIPE_BASIC_PLAN_PRICE_ID`, `STRIPE_STANDARD_PLAN_PRICE_ID`, `STRIPE_PREMIUM_PLAN_PRICE_ID` (oder projektabhängige `STRIPE_RESTAURANT_PRICE_ID`, `STRIPE_USER_PRICE_ID`)
- Herkunft:
  - Stripe Dashboard → Developers → API keys / Products (Prices)
  - Webhook-Secret: Stripe Dashboard → Developers → Webhooks → Endpoint auswählen → Signing secret
- URLs für Checkout-Redirects (bereits im Code):
  - `NEXT_PUBLIC_APP_URL` wird für `success_url` und `cancel_url` genutzt.
- Test:
  - Stripe CLI: `stripe listen --forward-to localhost:3000/api/payments/webhook`

## Supabase
- Benötigt:
  - `NEXT_PUBLIC_SUPABASE_URL` (public)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
  - `SUPABASE_SERVICE_ROLE_KEY` (secret)
  - Optional DB-Verbindungen: `DATABASE_URL`, `DIRECT_URL`
- Herkunft:
  - Supabase Dashboard → Settings → API (URL, Keys)
  - Verbindungs-Strings: Settings → Database → Connection strings
- Hinweise:
  - `SUPABASE_SERVICE_ROLE_KEY` niemals clientseitig verwenden.

## SMTP / E-Mail
- Benötigt:
  - `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`
  - `EMAIL_FROM` (Absender), `CONTACT_EMAIL`, `ADMIN_EMAIL`
- Herkunft:
  - Postmark, SendGrid, Mailgun, eigenes SMTP
- Sicherheit:
  - Verwende App-Passwörter oder dedizierte SMTP-Credentials; Port 465 → `secure=true`, sonst `false`.

## Cloudinary (Medien)
- Benötigt:
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET`
  - Optional: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- Herkunft:
  - Cloudinary Dashboard → Settings → API und Upload Presets

## Karten / Geocoding
- Benötigt:
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Google Cloud → Maps)
  - `OPENCAGE_API_KEY` (OpenCage Dashboard)

## Interne Sicherheits- und Integrations-Keys
- Benötigt:
  - `CRON_SECRET` (Autorisierung für Cron/Batch-Endpunkte)
  - `ADMIN_API_TOKEN` (Admin-Token für Netlify Functions/Backend)
  - `INTERNAL_API_SECRET` (Serverinterne Requests autorisieren)
  - `SUPABASE_WEBHOOK_SECRET` (Supabase Webhook-Validierung)
- Erzeugen:
  - `openssl rand -hex 32` oder `pwgen`/`uuidgen`
- Verwendung:
  - Diese Werte niemals im Client exponieren; ausschließlich Server/Functions.

## Weitere Konfigurationen
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WEBSITE_URL`, `NEXT_PUBLIC_APP_URL`:
  - Basis-URLs deiner App für Links, Webhooks und Redirects; in Produktion auf die echte Domain setzen.
- `NEXTAUTH_URL`:
  - Basis-URL für Auth-Flows und Stripe-Checkout-Redirects.
- `NEXT_PUBLIC_SUPABASE_COOKIE_NAME`:
  - Name für Auth-Cookie (default `contact-tables-auth`).
- `NETLIFY`, `NEXT_STANDALONE`, `SITE_URL`:
  - Build-/Deploy-spezifisch; `SITE_URL` wird u. a. in Netlify Functions genutzt.

## Produktion (Netlify) – Variablen setzen
- Netlify Dashboard → Site settings → Build & deploy → Environment
- Alle oben genannten Variablen hinzufügen.
- Achte auf korrekte Produktions-URLs (`NEXT_PUBLIC_SITE_URL`, `NEXTAUTH_URL`, `SITE_URL`).

## Verifikation & Tests
- Digistore24:
  - S2S-Verbindungstest im Backoffice; Server-Logs prüfen (Webhook 200/OK, `sha_sign` valid).
- Stripe:
  - Test-Webhooks mit Stripe CLI; Prüfe Signaturprüfung und Zahlungsstatus.
- SMTP:
  - Test-Mail senden (Admin-Seiten oder Test-Skripte); Zustellbarkeit prüfen.
- Supabase:
  - Auth-Flow und Admin-Operationen mit Service-Role testen.

## Sicherheit & Pflege
- Secrets regelmäßig rotieren (mind. halbjährlich).
- Keine Secrets im Client oder in öffentlichen Repos committen.
- Zugriffe minimieren (Least Privilege); Monitore/Logs für Webhooks aktivieren.

## Häufige Fehler
- Falsche Basis-URL: Redirects/Links zeigen ins Leere → `NEXT_PUBLIC_SITE_URL`, `NEXTAUTH_URL` korrekt setzen.
- Fehlende Webhook-Secrets: Stripe/Digistore Validierung schlägt fehl → Secrets hinterlegen.
- SMTP-Port/Secure-Flag falsch: Mailversand fehlschlägt → `EMAIL_SERVER_PORT` und `secure` prüfen.

---

### Troubleshooting-Checkliste
- Sind alle `NEXT_PUBLIC_…`-Variablen korrekt und öffentlich unkritisch?
- Sind alle Server-Secrets gesetzt und nur serverseitig verwendet?
- Stimmen die Produktions-URLs mit der echten Domain überein?
- Sind Webhook-Endpunkte öffentlich erreichbar (Firewall/Basic Auth vermeiden)?
- Wurden nach Änderungen Server/Builds neu gestartet?