import { NextApiRequest, NextApiResponse } from 'next';
import type { NextApiHandler } from 'next';

export interface RateLimitOptions {
  // Maximale Anzahl von Anfragen im Zeitfenster
  limit: number;
  // Zeitfenster in Millisekunden
  windowMs: number;
  // Optionale Funktion zur Identifizierung des Clients (Standard: IP-Adresse)
  keyGenerator?: (req: NextApiRequest) => string;
  // Optionale Funktion zur Bestimmung, ob eine Anfrage vom Rate-Limiting ausgenommen werden soll
  skip?: (req: NextApiRequest) => boolean;
  // Optionale Funktion zur Anpassung der Antwort bei Überschreitung des Limits
  handler?: (req: NextApiRequest, res: NextApiResponse) => void;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-Memory-Store für Rate-Limiting
// In einer Produktionsumgebung sollte ein verteilter Store wie Redis verwendet werden
const store: RateLimitStore = {};

// Bereinigt regelmäßig abgelaufene Einträge aus dem Store
const cleanupInterval = 10 * 60 * 1000; // 10 Minuten
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime <= now) {
      delete store[key];
    }
  });
}, cleanupInterval);

/**
 * Extrahiert die IP-Adresse aus der Anfrage
 */
const getIpAddress = (req: NextApiRequest): string => {
  // Versuche X-Forwarded-For Header zu verwenden (für Proxy-Setups)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(',')[0].trim();
  }
  
  // Fallback auf direkte Verbindungs-IP
  return req.socket.remoteAddress || '0.0.0.0';
};

/**
 * Standard-Handler für Überschreitung des Rate-Limits
 */
const defaultLimitExceededHandler = (req: NextApiRequest, res: NextApiResponse) => {
  res.status(429).json({
    error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
    retryAfter: Math.ceil((store[getIpAddress(req)]?.resetTime - Date.now()) / 1000) || 60
  });
};

/**
 * Rate-Limiting-Middleware für Next.js API-Routen
 */
export function withRateLimit(
  handler: NextApiHandler,
  options: RateLimitOptions
): NextApiHandler {
  const {
    limit = 60,
    windowMs = 60 * 1000, // 1 Minute
    keyGenerator = getIpAddress,
    skip = () => false,
    handler: limitExceededHandler = defaultLimitExceededHandler
  } = options;

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Prüfe, ob diese Anfrage übersprungen werden soll
    if (skip(req)) {
      return handler(req, res);
    }

    const key = keyGenerator(req);
    const now = Date.now();

    // Initialisiere oder aktualisiere den Store-Eintrag
    if (!store[key] || store[key].resetTime <= now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    // Inkrementiere den Zähler
    store[key].count += 1;

    // Setze Rate-Limit-Header
    const remaining = Math.max(0, limit - store[key].count);
    const reset = Math.ceil((store[key].resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', reset.toString());

    // Prüfe, ob das Limit überschritten wurde
    if (store[key].count > limit) {
      return limitExceededHandler(req, res);
    }

    // Fahre mit dem Handler fort
    return handler(req, res);
  };
}

/**
 * Hilfsfunktion zum einfachen Anwenden von Rate-Limiting auf API-Routen
 * mit verschiedenen Limits basierend auf der HTTP-Methode
 */
export function withMethodBasedRateLimit(
  handler: NextApiHandler,
  options: {
    defaultLimit?: number;
    defaultWindowMs?: number;
    methods?: {
      [key: string]: { limit: number; windowMs: number };
    };
    keyGenerator?: (req: NextApiRequest) => string;
    skip?: (req: NextApiRequest) => boolean;
    handler?: (req: NextApiRequest, res: NextApiResponse) => void;
  }
): NextApiHandler {
  const {
    defaultLimit = 60,
    defaultWindowMs = 60 * 1000,
    methods = {},
    keyGenerator,
    skip,
    handler: limitExceededHandler
  } = options;

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = req.method || 'GET';
    const methodConfig = methods[method] || { limit: defaultLimit, windowMs: defaultWindowMs };

    return withRateLimit(handler, {
      limit: methodConfig.limit,
      windowMs: methodConfig.windowMs,
      keyGenerator,
      skip,
      handler: limitExceededHandler
    })(req, res);
  };
}
