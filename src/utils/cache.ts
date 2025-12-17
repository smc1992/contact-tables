/**
 * Cache-Utility für häufig abgerufene Daten
 * 
 * Diese Utility bietet Funktionen zum Caching von Daten im Browser,
 * mit konfigurierbarer Ablaufzeit und automatischer Invalidierung.
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  /** Ablaufzeit in Millisekunden (Standard: 5 Minuten) */
  ttl?: number;
  /** Wenn true, wird der Cache auch bei Ablauf zurückgegeben und im Hintergrund aktualisiert */
  staleWhileRevalidate?: boolean;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 Minuten

/**
 * Speichert Daten im lokalen Cache mit einer konfigurierbaren Ablaufzeit
 * 
 * @param key - Eindeutiger Schlüssel für die Daten
 * @param data - Die zu speichernden Daten
 * @param options - Cache-Optionen
 */
export function setCache<T>(key: string, data: T, options: CacheOptions = {}): void {
  const now = Date.now();
  const ttl = options.ttl || DEFAULT_TTL;
  
  const cacheItem: CacheItem<T> = {
    data,
    timestamp: now,
    expiresAt: now + ttl
  };
  
  try {
    localStorage.setItem(`cache:${key}`, JSON.stringify(cacheItem));
  } catch (error) {
    console.warn('Cache konnte nicht gespeichert werden:', error);
  }
}

/**
 * Ruft Daten aus dem lokalen Cache ab
 * 
 * @param key - Eindeutiger Schlüssel für die Daten
 * @param options - Cache-Optionen
 * @returns Die gecachten Daten oder null, wenn keine Daten gefunden wurden oder abgelaufen sind
 */
export function getCache<T>(key: string, options: CacheOptions = {}): T | null {
  try {
    const cachedItem = localStorage.getItem(`cache:${key}`);
    if (!cachedItem) return null;
    
    const item = JSON.parse(cachedItem) as CacheItem<T>;
    const now = Date.now();
    
    // Cache ist noch gültig
    if (item.expiresAt > now) {
      return item.data;
    }
    
    // Cache ist abgelaufen, aber staleWhileRevalidate ist aktiviert
    if (options.staleWhileRevalidate) {
      return item.data;
    }
    
    // Cache ist abgelaufen
    return null;
  } catch (error) {
    console.warn('Cache konnte nicht abgerufen werden:', error);
    return null;
  }
}

/**
 * Löscht einen bestimmten Cache-Eintrag
 * 
 * @param key - Eindeutiger Schlüssel für die zu löschenden Daten
 */
export function invalidateCache(key: string): void {
  try {
    localStorage.removeItem(`cache:${key}`);
  } catch (error) {
    console.warn('Cache konnte nicht invalidiert werden:', error);
  }
}

/**
 * Löscht alle Cache-Einträge, die mit einem bestimmten Präfix beginnen
 * 
 * @param prefix - Präfix für die zu löschenden Cache-Schlüssel
 */
export function invalidateCacheByPrefix(prefix: string): void {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`cache:${prefix}`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Cache konnte nicht nach Präfix invalidiert werden:', error);
  }
}

/**
 * Wrapper-Funktion für asynchrone Datenabfragen mit Cache-Unterstützung
 * 
 * @param key - Eindeutiger Schlüssel für die Daten
 * @param fetchFn - Funktion zum Abrufen der Daten, wenn der Cache abgelaufen ist
 * @param options - Cache-Optionen
 * @returns Die Daten aus dem Cache oder von der Fetch-Funktion
 */
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Versuche, Daten aus dem Cache zu holen
  const cachedData = getCache<T>(key, options);
  
  // Wenn Daten im Cache sind und nicht abgelaufen, verwende sie
  if (cachedData !== null && !options.staleWhileRevalidate) {
    return cachedData;
  }
  
  // Wenn staleWhileRevalidate aktiviert ist und wir abgelaufene Daten haben,
  // starte die Aktualisierung im Hintergrund und gib die alten Daten zurück
  if (cachedData !== null && options.staleWhileRevalidate) {
    // Aktualisiere den Cache im Hintergrund
    fetchFn().then(freshData => {
      setCache(key, freshData, options);
    }).catch(error => {
      console.error('Fehler bei der Hintergrundaktualisierung des Caches:', error);
    });
    
    return cachedData;
  }
  
  // Wenn keine Daten im Cache sind oder sie abgelaufen sind, hole neue Daten
  try {
    const freshData = await fetchFn();
    setCache(key, freshData, options);
    return freshData;
  } catch (error) {
    // Bei einem Fehler versuche, abgelaufene Daten zurückzugeben
    if (cachedData !== null) {
      console.warn('Fehler beim Abrufen neuer Daten, verwende abgelaufene Cache-Daten:', error);
      return cachedData;
    }
    throw error;
  }
}
