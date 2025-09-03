/**
 * Server-Cache-Utility für API-Routen
 * 
 * Diese Utility bietet Funktionen zum Caching von API-Antworten auf dem Server,
 * um wiederholte Datenbankabfragen zu reduzieren und die Antwortzeiten zu verbessern.
 */

import { NextApiRequest, NextApiResponse } from 'next';

// In-Memory Cache für Serverantworten
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Globaler Cache-Speicher
const cache: Record<string, CacheEntry<any>> = {};

interface ServerCacheOptions {
  /** Ablaufzeit in Millisekunden (Standard: 60 Sekunden) */
  ttl?: number;
  /** Wenn true, wird der Cache auch bei Ablauf zurückgegeben und im Hintergrund aktualisiert */
  staleWhileRevalidate?: boolean;
}

const DEFAULT_TTL = 60 * 1000; // 60 Sekunden Standard-Cache-Zeit für Server

/**
 * Generiert einen Cache-Schlüssel basierend auf der Anfrage
 */
export function generateCacheKey(req: NextApiRequest): string {
  const { url, method, query } = req;
  return `${method}:${url}:${JSON.stringify(query)}`;
}

/**
 * Prüft, ob eine Antwort im Cache vorhanden ist
 */
export function getCachedResponse<T>(key: string, options: ServerCacheOptions = {}): T | null {
  const entry = cache[key];
  if (!entry) return null;

  const now = Date.now();
  
  // Cache ist noch gültig
  if (entry.expiresAt > now) {
    return entry.data;
  }
  
  // Cache ist abgelaufen, aber staleWhileRevalidate ist aktiviert
  if (options.staleWhileRevalidate) {
    return entry.data;
  }
  
  // Cache ist abgelaufen
  return null;
}

/**
 * Speichert eine Antwort im Cache
 */
export function setCachedResponse<T>(key: string, data: T, options: ServerCacheOptions = {}): void {
  const ttl = options.ttl || DEFAULT_TTL;
  const now = Date.now();
  
  cache[key] = {
    data,
    expiresAt: now + ttl
  };
}

/**
 * Löscht einen Cache-Eintrag
 */
export function invalidateCachedResponse(key: string): void {
  delete cache[key];
}

/**
 * Löscht alle Cache-Einträge, die mit einem bestimmten Präfix beginnen
 */
export function invalidateCachedResponseByPrefix(prefix: string): void {
  Object.keys(cache).forEach(key => {
    if (key.startsWith(prefix)) {
      delete cache[key];
    }
  });
}

/**
 * Middleware für das Caching von API-Antworten
 */
export function withCache<T>(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<T>,
  options: ServerCacheOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    // Nur GET-Anfragen cachen
    if (req.method !== 'GET') {
      return handler(req, res) as any;
    }
    
    const cacheKey = generateCacheKey(req);
    const cachedData = getCachedResponse<T>(cacheKey, options);
    
    if (cachedData !== null) {
      // Cache-Header setzen
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cachedData);
    }
    
    // Originalen Handler aufrufen
    const result = await handler(req, res);
    
    // Ergebnis cachen
    setCachedResponse(cacheKey, result, options);
    
    // Cache-Header setzen
    res.setHeader('X-Cache', 'MISS');
    
    return res.status(200).json(result);
  };
}
