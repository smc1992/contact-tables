import { useState, useEffect, useCallback } from 'react';
import { cachedGet, apiPost, apiPut, apiDelete } from '@/utils/api-cache';

interface UseApiOptions {
  /** Wenn true, werden die Daten beim ersten Rendern abgerufen */
  autoFetch?: boolean;
  /** Cache-Lebensdauer in Millisekunden */
  ttl?: number;
  /** Wenn true, werden abgelaufene Daten zurückgegeben und im Hintergrund aktualisiert */
  staleWhileRevalidate?: boolean;
  /** Wenn true, werden die Daten bei Fokussierung des Fensters erneut abgerufen */
  revalidateOnFocus?: boolean;
  /** Wenn true, werden Fehler im Cache gespeichert */
  cacheErrors?: boolean;
}

/**
 * Hook für API-Anfragen mit Cache-Unterstützung
 * 
 * @param url - Die URL der API-Anfrage
 * @param options - API- und Cache-Optionen
 * @returns Ein Objekt mit den Daten, Lade- und Fehlerstatus sowie Funktionen für CRUD-Operationen
 */
export function useApiCache<T, PostData = any, PutData = any>(
  url: string,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    autoFetch = true,
    ttl = 5 * 60 * 1000, // 5 Minuten Standard-Cache-Zeit
    staleWhileRevalidate = false,
    revalidateOnFocus = false,
    cacheErrors = false
  } = options;

  // GET-Anfrage mit Cache
  const fetchData = useCallback(async (skipCache = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await cachedGet<T>(url, {
        ttl: skipCache ? 0 : ttl,
        staleWhileRevalidate,
        cacheErrors
      });
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error(`Fehler beim Abrufen der Daten von ${url}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [url, ttl, staleWhileRevalidate, cacheErrors]);

  // POST-Anfrage (ohne Cache)
  const postData = useCallback(async (postData: PostData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiPost<T, PostData>(url, postData);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error(`Fehler beim Senden der Daten an ${url}:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  // PUT-Anfrage (ohne Cache)
  const putData = useCallback(async (putData: PutData, id?: string | number) => {
    const putUrl = id ? `${url}/${id}` : url;
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiPut<T, PutData>(putUrl, putData);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error(`Fehler beim Aktualisieren der Daten auf ${putUrl}:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  // DELETE-Anfrage (ohne Cache)
  const deleteData = useCallback(async (id?: string | number) => {
    const deleteUrl = id ? `${url}/${id}` : url;
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiDelete<T>(deleteUrl);
      setData(null);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error(`Fehler beim Löschen der Daten auf ${deleteUrl}:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  // Effekt zum automatischen Abrufen der Daten
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  // Effekt zum Neuladen der Daten bei Fokussierung des Fensters
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData, revalidateOnFocus]);

  return {
    data,
    isLoading,
    error,
    get: fetchData,
    post: postData,
    put: putData,
    delete: deleteData
  };
}

export default useApiCache;
