# Contact Tables - Technische Dokumentation

Dieses Dokument beschreibt die technische Architektur und die Best Practices für das `contact-tables` Projekt.

## 1. Technologie-Stack

- **Framework**: [Next.js](https://nextjs.org/) (mit Pages Router)
- **Authentifizierung & Datenbank**: [Supabase](https://supabase.io/) (PostgreSQL)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI-Komponenten**: Headless UI, Radix UI (implizit über andere Bibliotheken)
- **Formular-Handling**: React Hook Form
- **Notifications**: React Hot Toast
- **Icons**: React Icons

## 2. Lokales Setup

1.  **Abhängigkeiten installieren**:
    ```bash
    npm install
    ```

2.  **Umgebungsvariablen erstellen**:
    Kopieren Sie die `.env.example` zu einer neuen Datei `.env.local` und füllen Sie die Supabase-spezifischen Variablen aus:
    ```
    NEXT_PUBLIC_SUPABASE_URL=deine-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
    DATABASE_URL=deine-postgresql-connection-url-von-supabase
    DIRECT_URL=deine-direct-connection-url-von-supabase
    ```
    **Wichtig**: `DATABASE_URL` und `DIRECT_URL` sind für Prisma erforderlich. Sie finden beide in den Datenbank-Einstellungen Ihres Supabase-Projekts.

3.  **Prisma Client generieren**:
    Nach jeder Änderung am `schema.prisma` muss der Prisma-Client neu generiert werden:
    ```bash
    npx prisma generate
    ```

4.  **Datenbank-Schema synchronisieren**:
    Um das lokale Prisma-Schema mit der Supabase-Datenbank abzugleichen:
    ```bash
    npx prisma db push
    ```

5.  **Entwicklungsserver starten**:
    ```bash
    npm run dev
    ```

## 3. Authentifizierung mit Supabase & Next.js (Pages Router)

Eine konsistente, serverseitige Authentifizierung ist entscheidend für die Sicherheit und Stabilität der Anwendung. Wir verwenden das `@supabase/ssr` Paket, das für serverseitiges Rendering (SSR) optimiert ist.

### 3.1. Das Kernstück: `createClient`

Die zentrale Funktion zur Initialisierung des Supabase-Clients befindet sich in `src/utils/supabase/server.ts`. **Jede serverseitige Interaktion mit Supabase muss diese Funktion verwenden.**

```typescript
// src/utils/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type GetServerSidePropsContext } from 'next'

export function createClient(context: GetServerSidePropsContext) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return context.req.cookies[name]
        },
        set(name: string, value: string, options: CookieOptions) {
          context.res.setHeader('Set-Cookie', ...)
        },
        remove(name: string, options: CookieOptions) {
          context.res.setHeader('Set-Cookie', ...)
        },
      },
    }
  )
}
```

Diese Funktion stellt sicher, dass Cookies korrekt zwischen dem Browser des Benutzers und dem Server ausgetauscht werden, was für die Aufrechterhaltung der Authentifizierungssitzung bei SSR unerlässlich ist.

### 3.2. Seiten schützen (`getServerSideProps`)

Um eine Seite nur für authentifizierte Benutzer zugänglich zu machen, wird `getServerSideProps` verwendet:

```typescript
import { createClient } from '@/utils/supabase/server';

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabase = createClient(ctx);
  const { data: { user } } = await supabase.auth.getUser();

  // Fall 1: Benutzer ist nicht eingeloggt
  if (!user) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  // Fall 2: Rollenbasierte Zugriffskontrolle (RBAC)
  if (user.user_metadata.role !== 'RESTAURANT') {
    return { redirect: { destination: '/', permanent: false } }; // Oder eine Fehlerseite
  }

  // Benutzer ist authentifiziert und autorisiert
  return { props: { user } };
};
```

### 3.3. API-Routen schützen

API-Routen werden nach dem gleichen Muster geschützt. Der `context` für `createClient` wird hier direkt aus dem `req` und `res` Objekt der API-Route erstellt.

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient({ req, res }); // Angepasster Aufruf für APIs
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata.role !== 'RESTAURANT') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  // Logik für authentifizierte und autorisierte Benutzer
  // ...
}
```

### 3.4. Rollenbasierte Zugriffskontrolle (RBAC)

Die Rolle eines Benutzers (`CUSTOMER`, `RESTAURANT`, `ADMIN`) ist in den `user_metadata` des Supabase-Benutzerobjekts gespeichert. Der Zugriff erfolgt über `user.user_metadata.role`.

**Best Practice**: Verlassen Sie sich immer auf die Metadaten des `user`-Objekts für die Rollenprüfung. Führen Sie keine zusätzlichen Datenbankabfragen auf eine `profiles`-Tabelle durch, nur um die Rolle zu ermitteln. Dies ist ineffizient und eine potenzielle Fehlerquelle.

### 3.5. Häufige Fehler und deren Vermeidung

-   **Inkonsistente Client-Initialisierung**: Die Verwendung veralteter Methoden (z.B. von `@supabase/auth-helpers-nextjs`) oder die manuelle Erstellung von Clients führt zu unvorhersehbarem Verhalten und Redirect-Schleifen. **Immer `createClient` aus `utils/supabase/server.ts` verwenden!**
-   **Client-seitige Logik für Schutz**: Verlassen Sie sich niemals auf client-seitige Prüfungen zur Absicherung von Daten oder Seiten. Die Autorisierung muss immer auf dem Server stattfinden.

## 4. Datenbank und Prisma

Prisma ist unser ORM für die Interaktion mit der Supabase PostgreSQL-Datenbank.

-   **Schema**: Das Datenbankschema ist in `prisma/schema.prisma` definiert.
-   **Client**: Der Prisma-Client wird zentral in `src/lib/prisma.ts` instanziiert und sollte von dort importiert werden.
-   **Sicherheit**: In API-Routen sollte die `userId` oder `restaurantId` immer serverseitig aus dem authentifizierten `user`-Objekt abgeleitet und nicht blind vom Client übernommen werden, um Manipulationen zu verhindern.

Eine Plattform, die Menschen an Restauranttischen zusammenbringt, um Einsamkeit zu bekämpfen und echte Gespräche zu fördern.

## Über das Projekt

Contact Tables ist eine Vermittlungsplattform, bei der Nutzer nach Restaurants suchen können, aber die eigentliche Reservierung direkt beim Restaurant erfolgt. Die Anwendung ist in Deutsch und verwendet Next.js mit Tailwind CSS für das Frontend.

## Funktionen

- **Restaurantsuche**: Finde Restaurants in deiner Nähe
- **Kontakttische**: Erstelle oder tritt Kontakttischen bei, um neue Menschen kennenzulernen
- **Benutzerverwaltung**: Registrierung, Anmeldung und Profilbearbeitung
- **Restaurantverwaltung**: Restaurantinhaber können ihre Daten und Bilder verwalten
- **Zahlungsabwicklung**: Premium-Funktionen für zahlende Benutzer
- **Admin-Bereich**: Verwaltung von Benutzern, Restaurants und Kontakttischen

## Technologien

- **Frontend**: Next.js, React, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Datenbank**: PostgreSQL
- **Authentifizierung**: NextAuth.js
- **Zahlungen**: Stripe
- **E-Mail**: Nodemailer
- **Bildupload**: Cloudinary

## Installation

1. Repository klonen:
   ```bash
   git clone https://github.com/yourusername/contact-tables.git
   cd contact-tables
   ```

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

3. Umgebungsvariablen konfigurieren:
   - Kopiere `.env.example` zu `.env.local` und fülle die Werte aus

4. Datenbank-Migration ausführen:
   ```bash
   npx prisma migrate dev
   ```

5. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

## Produktions-Deployment

1. Umgebungsvariablen für die Produktion konfigurieren:
   - Erstelle `.env.production` mit den tatsächlichen Werten

2. Datenbank-Migration für die Produktion ausführen:
   ```bash
   npx prisma migrate deploy
   ```

3. Admin-Benutzer erstellen:
   ```bash
   node scripts/create-admin.js
   ```

4. Produktions-Build erstellen:
   ```bash
   npm run build
   ```

5. Anwendung starten:
   ```bash
   npm start
   ```

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.
