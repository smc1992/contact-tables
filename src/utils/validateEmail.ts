/**
 * Verbesserte E-Mail-Validierungsfunktion
 * Prüft auf gültige Syntax und Domain-Format
 */
export function validateEmail(email: string): { valid: boolean; reason?: string } {
  // Grundlegende Syntax-Überprüfung
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicRegex.test(email)) {
    return { valid: false, reason: 'Ungültiges E-Mail-Format' };
  }

  // Erweiterte Validierung
  const parts = email.split('@');
  const localPart = parts[0];
  const domain = parts[1];

  // Lokalteil-Prüfung
  if (localPart.length > 64) {
    return { valid: false, reason: 'Lokaler Teil der E-Mail ist zu lang (max. 64 Zeichen)' };
  }

  // Domain-Prüfung
  if (domain.length > 255) {
    return { valid: false, reason: 'Domain-Teil der E-Mail ist zu lang (max. 255 Zeichen)' };
  }

  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return { valid: false, reason: 'Domain muss mindestens eine Top-Level-Domain haben' };
  }

  // TLD-Prüfung (Top-Level-Domain)
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { valid: false, reason: 'Top-Level-Domain ist zu kurz' };
  }

  // Prüfung auf häufige Tippfehler in bekannten Domains
  const commonDomains: { [key: string]: string } = {
    'gmial.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'hotmial.com': 'hotmail.com',
    'hotmal.com': 'hotmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'outloo.com': 'outlook.com',
    'outlok.com': 'outlook.com'
  };

  if (commonDomains[domain]) {
    return { 
      valid: false, 
      reason: `Meinten Sie ${localPart}@${commonDomains[domain]}?` 
    };
  }

  return { valid: true };
}

/**
 * Prüft, ob eine E-Mail-Adresse temporär ist (Wegwerf-E-Mail)
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'mailinator.com', 'tempmail.com', 'temp-mail.org', 'guerrillamail.com',
    'yopmail.com', '10minutemail.com', 'trashmail.com', 'mailnesia.com',
    'tempr.email', 'dispostable.com', 'sharklasers.com', 'guerrillamail.info'
  ];

  const domain = email.split('@')[1];
  return disposableDomains.includes(domain);
}
