/**
 * API-Cache-Utility für die Optimierung von API-Anfragen
 * 
 * Diese Utility bietet Funktionen zum Caching von API-Antworten,
 * um wiederholte Anfragen zu optimieren und die Serverbelastung zu reduzieren.
 */

import { cachedFetch, CacheOptions } from './cache';

interface ApiCacheOptions extends CacheOptions {
  /** Wenn true, werden Fehler im Cache gespeichert (Standard: false) */
  cacheErrors?: boolean;
}

/**
 * Führt eine API-Anfrage mit Cache-Unterstützung durch
 * 
 * @param url - Die URL der API-Anfrage
 * @param options - Fetch-Optionen und Cache-Optionen
 * @returns Die API-Antwort als JSON
 */
export async function cachedApiRequest<T>(
  url: string,
  options: RequestInit & ApiCacheOptions = {}
): Promise<T> {
  // Extrahiere Cache-Optionen
  const { 
    ttl, 
    staleWhileRevalidate, 
    cacheErrors = false,
    ...fetchOptions 
  } = options;
  
  // Erstelle einen Cache-Schlüssel basierend auf URL und Methode
  const method = fetchOptions.method || 'GET';
  const cacheKey = `api:${method}:${url}:${JSON.stringify(fetchOptions.body || '')}`;
  
  // Verwende cachedFetch für die Anfrage
  return cachedFetch<T>(
    cacheKey,
    async () => {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok && !cacheErrors) {
        throw new Error(`API-Fehler: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    { ttl, staleWhileRevalidate }
  );
}

/**
 * Führt eine GET-Anfrage mit Cache-Unterstützung durch
 * 
 * @param url - Die URL der API-Anfrage
 * @param options - Fetch-Optionen und Cache-Optionen
 * @returns Die API-Antwort als JSON
 */
export async function cachedGet<T>(
  url: string,
  options: Omit<RequestInit, 'method'> & ApiCacheOptions = {}
): Promise<T> {
  return cachedApiRequest<T>(url, {
    ...options,
    method: 'GET'
  });
}

/**
 * Führt eine POST-Anfrage durch (ohne Caching)
 * 
 * @param url - Die URL der API-Anfrage
 * @param data - Die zu sendenden Daten
 * @param options - Fetch-Optionen
 * @returns Die API-Antwort als JSON
 */
export async function apiPost<T, D = any>(
  url: string,
  data: D,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`API-Fehler: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Führt eine PUT-Anfrage durch (ohne Caching)
 * 
 * @param url - Die URL der API-Anfrage
 * @param data - Die zu sendenden Daten
 * @param options - Fetch-Optionen
 * @returns Die API-Antwort als JSON
 */
export async function apiPut<T, D = any>(
  url: string,
  data: D,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`API-Fehler: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Führt eine DELETE-Anfrage durch (ohne Caching)
 * 
 * @param url - Die URL der API-Anfrage
 * @param options - Fetch-Optionen
 * @returns Die API-Antwort als JSON
 */
export async function apiDelete<T>(
  url: string,
  options: Omit<RequestInit, 'method'> = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error(`API-Fehler: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}
