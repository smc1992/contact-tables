import { NextApiRequest, NextApiResponse } from 'next';
import type { NextApiHandler } from 'next';

export interface CacheOptions {
  // Zeit in Millisekunden, wie lange ein Eintrag im Cache gültig ist
  ttl: number;
  // Wenn true, wird eine veraltete Antwort zurückgegeben, während im Hintergrund eine neue angefordert wird
  staleWhileRevalidate?: boolean;
  // Optionale Funktion zur Generierung eines Cache-Schlüssels
  keyGenerator?: (req: NextApiRequest) => string;
  // Optionale Funktion zur Bestimmung, ob eine Anfrage gecacht werden soll
  shouldCache?: (req: NextApiRequest) => boolean;
}

interface CacheEntry {
  data: any;
  expiresAt: number;
}

interface CacheStore {
  [key: string]: CacheEntry;
}

// In-Memory-Cache-Store
// In einer Produktionsumgebung sollte ein verteilter Cache wie Redis verwendet werden
const cacheStore: CacheStore = {};

// Bereinigt regelmäßig abgelaufene Einträge aus dem Cache
const cleanupInterval = 10 * 60 * 1000; // 10 Minuten
setInterval(() => {
  const now = Date.now();
  Object.keys(cacheStore).forEach(key => {
    if (cacheStore[key].expiresAt <= now) {
      delete cacheStore[key];
    }
  });
}, cleanupInterval);

/**
 * Generiert einen Cache-Schlüssel basierend auf der Anfrage
 */
const defaultKeyGenerator = (req: NextApiRequest): string => {
  const { url, method, query, body } = req;
  return `${method || 'GET'}-${url}-${JSON.stringify(query)}-${JSON.stringify(body || {})}`;
};

/**
 * Bestimmt, ob eine Anfrage gecacht werden soll
 */
const defaultShouldCache = (req: NextApiRequest): boolean => {
  // Standardmäßig nur GET-Anfragen cachen
  return req.method === 'GET';
};

/**
 * Cache-Middleware für Next.js API-Routen
 */
export function withCache(
  handler: NextApiHandler,
  options: CacheOptions
): NextApiHandler {
  const {
    ttl,
    staleWhileRevalidate = false,
    keyGenerator = defaultKeyGenerator,
    shouldCache = defaultShouldCache
  } = options;

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Prüfe, ob diese Anfrage gecacht werden soll
    if (!shouldCache(req)) {
      return handler(req, res);
    }

    const cacheKey = keyGenerator(req);
    const now = Date.now();
    const cachedEntry = cacheStore[cacheKey];

    // Wenn ein gültiger Cache-Eintrag existiert, verwende ihn
    if (cachedEntry && cachedEntry.expiresAt > now) {
      // Setze Cache-Header
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Expires', new Date(cachedEntry.expiresAt).toUTCString());
      
      // Wenn staleWhileRevalidate aktiviert ist und der Eintrag bald abläuft,
      // aktualisiere den Cache im Hintergrund
      const timeToExpiry = cachedEntry.expiresAt - now;
      if (staleWhileRevalidate && timeToExpiry < ttl * 0.2) {
        // Nicht auf die Antwort warten, um die Latenz niedrig zu halten
        refreshCache(handler, req, res, cacheKey, ttl).catch(console.error);
      }
      
      return res.status(200).json(cachedEntry.data);
    }

    // Wenn ein abgelaufener Eintrag existiert und staleWhileRevalidate aktiviert ist,
    // verwende den abgelaufenen Eintrag und aktualisiere im Hintergrund
    if (staleWhileRevalidate && cachedEntry) {
      res.setHeader('X-Cache', 'STALE');
      res.setHeader('X-Cache-Expires', new Date(cachedEntry.expiresAt).toUTCString());
      
      // Nicht auf die Antwort warten
      refreshCache(handler, req, res, cacheKey, ttl).catch(console.error);
      
      return res.status(200).json(cachedEntry.data);
    }

    // Kein Cache-Eintrag oder abgelaufen ohne staleWhileRevalidate
    // Führe den Handler aus und speichere das Ergebnis im Cache
    try {
      // Erstelle eine Kopie der Response, um sie zu modifizieren
      const originalJson = res.json;
      let responseData: any;
      
      // Überschreibe die json-Methode, um die Antwort abzufangen
      res.json = function(data: any) {
        responseData = data;
        cacheStore[cacheKey] = {
          data,
          expiresAt: now + ttl
        };
        
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Expires', new Date(now + ttl).toUTCString());
        
        return originalJson.call(this, data);
      };
      
      // Führe den Handler aus
      const result = await handler(req, res);
      
      // Wenn der Handler ein Objekt zurückgibt (anstatt res.json zu verwenden),
      // speichere es im Cache und gib es zurück
      if (result && !responseData) {
        cacheStore[cacheKey] = {
          data: result,
          expiresAt: now + ttl
        };
        
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Expires', new Date(now + ttl).toUTCString());
        
        if (!res.writableEnded) {
          res.status(200).json(result);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error in cache handler:', error);
      return handler(req, res);
    }
  };
}

/**
 * Aktualisiert einen Cache-Eintrag im Hintergrund
 */
async function refreshCache(
  handler: NextApiHandler,
  req: NextApiRequest,
  res: NextApiResponse,
  cacheKey: string,
  ttl: number
): Promise<void> {
  // Erstelle eine Kopie der Anfrage und Response-Objekte
  const reqClone = { ...req, headers: { ...req.headers } };
  const resClone = {
    setHeader: () => {},
    status: () => ({ json: () => {} }),
    json: (data: any) => {
      const now = Date.now();
      cacheStore[cacheKey] = {
        data,
        expiresAt: now + ttl
      };
    }
  } as unknown as NextApiResponse;

  try {
    const result = await handler(reqClone, resClone);
    if (result) {
      const now = Date.now();
      cacheStore[cacheKey] = {
        data: result,
        expiresAt: now + ttl
      };
    }
  } catch (error) {
    console.error('Error refreshing cache:', error);
  }
}
