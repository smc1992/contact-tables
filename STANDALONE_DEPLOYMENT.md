# Next.js Standalone-Modus Deployment

Diese Dokumentation beschreibt die Konfiguration und Deployment-Strategie für die Contact Tables Anwendung im Next.js Standalone-Modus.

## Überblick

Next.js bietet mit dem Standalone-Modus (`output: 'standalone'`) eine optimierte Deployment-Option, die eine eigenständige, minimale Serveranwendung erzeugt. Diese Konfiguration ist besonders für Produktionsumgebungen und Serverless-Plattformen wie Netlify geeignet.

## Bekannte Herausforderungen

Der Standalone-Modus von Next.js hat eine wichtige Einschränkung: Statische Dateien aus dem `public`-Verzeichnis werden nicht automatisch in das `.next/standalone/public`-Verzeichnis kopiert. Dies kann zu 404-Fehlern für Ressourcen wie Schriftarten, Bilder und andere statische Dateien führen.

## Implementierte Lösung

Um dieses Problem zu beheben, wurde folgende Lösung implementiert:

1. **Kopier-Skript**: Ein Node.js-Skript (`scripts/copy-static-files.js`), das alle Dateien aus dem `public`-Verzeichnis rekursiv in das `.next/standalone/public`-Verzeichnis kopiert.

2. **Build-Prozess-Integration**: Das Skript wurde in den Build-Prozess integriert, sodass es automatisch nach dem Next.js-Build ausgeführt wird.

3. **Server-Start-Anpassung**: Der Startbefehl wurde aktualisiert, um den Standalone-Server direkt zu starten.

## Konfigurationsänderungen

### package.json

Die folgenden Änderungen wurden in der `package.json` vorgenommen:

```json
"scripts": {
  "dev": "NODE_TLS_REJECT_UNAUTHORIZED=0 next dev -p 3000",
  "build": "prisma generate && next build && node scripts/copy-static-files.js",
  "start": "node .next/standalone/server.js",
  ...
}
```

### next.config.js

Die Next.js-Konfiguration enthält:

```javascript
module.exports = {
  output: 'standalone',
  // Weitere Konfigurationen...
}
```

## Verwendung

### Entwicklung

Für die lokale Entwicklung verwenden Sie weiterhin:

```bash
npm run dev
```

### Produktion

Für die Produktionsumgebung:

1. Build erstellen:
```bash
npm run build
```

2. Server starten:
```bash
npm run start
```

## Fehlerbehebung

Bei 404-Fehlern für statische Ressourcen:

1. Überprüfen Sie, ob das Kopier-Skript während des Builds erfolgreich ausgeführt wurde.
2. Stellen Sie sicher, dass die Dateien im `.next/standalone/public`-Verzeichnis vorhanden sind.
3. Überprüfen Sie die Pfade in Ihrem Code, um sicherzustellen, dass sie auf `/public/...` und nicht auf andere Verzeichnisse verweisen.

## Netlify-Deployment

Für Netlify-Deployments ist keine zusätzliche Konfiguration erforderlich, da der Build-Prozess bereits das Kopieren der statischen Dateien beinhaltet. Die Netlify-Konfiguration in `netlify.toml` sollte den Build-Befehl verwenden, der in `package.json` definiert ist.
