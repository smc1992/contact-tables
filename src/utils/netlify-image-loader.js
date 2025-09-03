/**
 * Netlify Image Loader für Next.js
 * Optimiert für die Verwendung mit Netlify Image Optimization Service
 */

export default function netlifyImageLoader({ src, width, quality }) {
  // Wenn die Quelle bereits eine URL ist, verwende sie direkt
  if (src.startsWith('http') || src.startsWith('https')) {
    // Verwende Netlify Image Transformation API
    const url = new URL(`/.netlify/images`, window.location.origin);
    url.searchParams.append('url', encodeURIComponent(src));
    url.searchParams.append('w', width.toString());
    url.searchParams.append('q', (quality || 75).toString());
    return url.href;
  }
  
  // Für lokale Bilder
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}
