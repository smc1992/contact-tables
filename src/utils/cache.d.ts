/**
 * TypeScript-Definitionen für die Cache-Utility
 */

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheOptions {
  /** Ablaufzeit in Millisekunden (Standard: 5 Minuten) */
  ttl?: number;
  /** Wenn true, wird der Cache auch bei Ablauf zurückgegeben und im Hintergrund aktualisiert */
  staleWhileRevalidate?: boolean;
}

/**
 * Speichert Daten im lokalen Cache mit einer konfigurierbaren Ablaufzeit
 */
export function setCache<T>(key: string, data: T, options?: CacheOptions): void;

/**
 * Ruft Daten aus dem lokalen Cache ab
 */
export function getCache<T>(key: string, options?: CacheOptions): T | null;

/**
 * Löscht einen bestimmten Cache-Eintrag
 */
export function invalidateCache(key: string): void;

/**
 * Löscht alle Cache-Einträge, die mit einem bestimmten Präfix beginnen
 */
export function invalidateCacheByPrefix(prefix: string): void;

/**
 * Wrapper-Funktion für asynchrone Datenabfragen mit Cache-Unterstützung
 */
export function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: CacheOptions
): Promise<T>;
