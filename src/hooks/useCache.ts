import { useState, useEffect, useCallback } from 'react';
import { getCache, setCache, invalidateCache, CacheOptions } from '@/utils/cache';

interface UseCacheOptions extends CacheOptions {
  /** Wenn true, werden die Daten beim ersten Rendern abgerufen */
  autoFetch?: boolean;
  /** Wenn true, werden die Daten bei jedem Rendern erneut abgerufen */
  revalidateOnMount?: boolean;
  /** Wenn true, werden die Daten bei Fokussierung des Fensters erneut abgerufen */
  revalidateOnFocus?: boolean;
}

/**
 * Hook zum Abrufen und Cachen von Daten
 * 
 * @param key - Eindeutiger Schlüssel für die Daten
 * @param fetchFn - Funktion zum Abrufen der Daten
 * @param options - Cache-Optionen
 * @returns Ein Objekt mit den Daten, Lade- und Fehlerstatus sowie Funktionen zum manuellen Aktualisieren
 */
export function useCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const [data, setData] = useState<T | null>(() => {
    // Versuche, Daten aus dem Cache zu laden beim ersten Rendern
    return getCache<T>(key, options);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Funktion zum Abrufen der Daten
  const fetchData = useCallback(async (skipCache = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Wenn skipCache false ist, prüfe zuerst den Cache
      if (!skipCache) {
        const cachedData = getCache<T>(key, options);
        if (cachedData !== null) {
          setData(cachedData);
          setIsLoading(false);
          return;
        }
      }

      // Daten abrufen
      const freshData = await fetchFn();
      
      // Daten im Cache speichern
      setCache<T>(key, freshData, options);
      
      // State aktualisieren
      setData(freshData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error(`Fehler beim Abrufen der Daten für ${key}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchFn, options]);

  // Funktion zum manuellen Invalidieren des Caches und Neuladen der Daten
  const invalidateAndRefetch = useCallback(async () => {
    invalidateCache(key);
    await fetchData(true);
  }, [key, fetchData]);

  // Effekt zum automatischen Abrufen der Daten
  useEffect(() => {
    // Wenn autoFetch aktiviert ist oder wir keine Daten haben und revalidateOnMount aktiviert ist
    if (options.autoFetch || (options.revalidateOnMount && !data)) {
      fetchData();
    }
  }, [fetchData, options.autoFetch, options.revalidateOnMount, data]);

  // Effekt zum Neuladen der Daten bei Fokussierung des Fensters
  useEffect(() => {
    if (!options.revalidateOnFocus) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData, options.revalidateOnFocus]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    invalidateAndRefetch
  };
}

export default useCache;
