/**
 * Formatiert ein Datum in ein deutsches Format (DD.MM.YYYY)
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatiert ein Datum mit Uhrzeit (DD.MM.YYYY, HH:MM)
 */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })}, ${d.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
}

/**
 * Berechnet die Differenz zwischen zwei Daten in Tagen
 */
export function daysBetween(date1: Date | string, date2: Date | string = new Date()): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Prüft, ob ein Datum in der Vergangenheit liegt
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Prüft, ob ein Datum in der Zukunft liegt
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d > new Date();
}

/**
 * Fügt eine bestimmte Anzahl von Tagen zu einem Datum hinzu
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Formatiert ein Datum als relativen Zeitraum (vor 2 Tagen, in 3 Stunden, etc.)
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (seconds < 0) {
    // Zukunft
    if (seconds > -60) return 'in wenigen Sekunden';
    if (seconds > -3600) return `in ${Math.floor(-seconds / 60)} Minuten`;
    if (seconds > -86400) return `in ${Math.floor(-seconds / 3600)} Stunden`;
    if (seconds > -604800) return `in ${Math.floor(-seconds / 86400)} Tagen`;
    if (seconds > -2592000) return `in ${Math.floor(-seconds / 604800)} Wochen`;
    if (seconds > -31536000) return `in ${Math.floor(-seconds / 2592000)} Monaten`;
    return `in ${Math.floor(-seconds / 31536000)} Jahren`;
  } else {
    // Vergangenheit
    if (seconds < 60) return 'gerade eben';
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Minuten`;
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Stunden`;
    if (seconds < 604800) return `vor ${Math.floor(seconds / 86400)} Tagen`;
    if (seconds < 2592000) return `vor ${Math.floor(seconds / 604800)} Wochen`;
    if (seconds < 31536000) return `vor ${Math.floor(seconds / 2592000)} Monaten`;
    return `vor ${Math.floor(seconds / 31536000)} Jahren`;
  }
}
