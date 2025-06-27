# Contact Tables

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
