/**
 * DKIM-Schlüsselpaar-Generator
 * Erzeugt RSA-Schlüsselpaare für DKIM-Authentifizierung
 */

import crypto from 'crypto';

/**
 * Generiert ein DKIM-Schlüsselpaar (privater und öffentlicher Schlüssel)
 * @param keySize Schlüsselgröße in Bits (2048 empfohlen)
 * @returns Ein Objekt mit privatem und öffentlichem Schlüssel
 */
export function generateDkimKeyPair(keySize: number = 2048): { privateKey: string; publicKey: string; dnsRecord: string } {
  try {
    // RSA-Schlüsselpaar generieren
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: keySize,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    // Öffentlichen Schlüssel für DNS-Eintrag formatieren
    // Entferne Header, Footer und Zeilenumbrüche
    const publicKeyBase64 = publicKey
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\n/g, '')
      .trim();

    // DNS-TXT-Eintrag für DKIM erstellen
    const dnsRecord = `v=DKIM1; k=rsa; p=${publicKeyBase64}`;

    return {
      privateKey,
      publicKey,
      dnsRecord
    };
  } catch (error) {
    console.error('Fehler bei der DKIM-Schlüsselgenerierung:', error);
    throw new Error('DKIM-Schlüsselgenerierung fehlgeschlagen');
  }
}

/**
 * Erstellt DNS-Einträge für E-Mail-Authentifizierung
 * @param domain Die Domain, für die die Einträge erstellt werden sollen
 * @param selector Der DKIM-Selector (z.B. 'default', 'mail', etc.)
 * @param dkimPublicKey Der öffentliche DKIM-Schlüssel
 * @param spfRecord Der SPF-Eintrag
 * @param dmarcPolicy Die DMARC-Richtlinie ('none', 'quarantine', 'reject')
 * @returns Ein Objekt mit DNS-Einträgen
 */
export function createDnsRecords(
  domain: string,
  selector: string,
  dkimPublicKey: string,
  spfRecord: string = 'v=spf1 mx a include:_spf.google.com ~all',
  dmarcPolicy: string = 'none'
): { spf: string; dkim: string; dmarc: string } {
  // SPF-Eintrag (TXT-Record für die Domain)
  const spfEntry = `${domain}. IN TXT "${spfRecord}"`;

  // DKIM-Eintrag (TXT-Record für selector._domainkey.domain)
  const dkimEntry = `${selector}._domainkey.${domain}. IN TXT "${dkimPublicKey}"`;

  // DMARC-Eintrag (TXT-Record für _dmarc.domain)
  const dmarcEntry = `_dmarc.${domain}. IN TXT "v=DMARC1; p=${dmarcPolicy}; sp=${dmarcPolicy}; adkim=r; aspf=r; rua=mailto:dmarc-reports@${domain}; ruf=mailto:dmarc-reports@${domain}; fo=1;"`;

  return {
    spf: spfEntry,
    dkim: dkimEntry,
    dmarc: dmarcEntry
  };
}

/**
 * Signiert eine E-Mail mit DKIM
 * @param email Der E-Mail-Text (Header + Body)
 * @param privateKey Der private DKIM-Schlüssel
 * @param domain Die Domain
 * @param selector Der DKIM-Selector
 * @returns Die signierte E-Mail
 */
export function signEmailWithDkim(
  email: string,
  privateKey: string,
  domain: string,
  selector: string
): string {
  try {
    // Trennen von Header und Body
    const [headerSection, bodySection] = email.split('\r\n\r\n');
    
    // Header parsen
    const headers = headerSection.split('\r\n');
    
    // Zu signierende Header-Felder
    const headersToSign = ['from', 'to', 'subject', 'date'];
    
    // Kanonisierte Header erstellen
    const canonicalizedHeaders = headers
      .filter(header => {
        const headerName = header.split(':')[0].toLowerCase();
        return headersToSign.includes(headerName);
      })
      .join('\r\n') + '\r\n';
    
    // Kanonisierter Body
    const canonicalizedBody = bodySection.trim() + '\r\n';
    
    // Hash des Bodys erstellen
    const bodyHash = crypto
      .createHash('sha256')
      .update(canonicalizedBody)
      .digest('base64');
    
    // DKIM-Signatur-Header erstellen (ohne die Signatur selbst)
    const dkimHeader = [
      'v=1',
      `a=rsa-sha256`,
      `d=${domain}`,
      `s=${selector}`,
      `c=relaxed/relaxed`,
      `q=dns/txt`,
      `t=${Math.floor(Date.now() / 1000)}`,
      `h=${headersToSign.join(':')}`,
      `bh=${bodyHash}`,
      'b='
    ].join('; ');
    
    // Signatur erstellen
    const signer = crypto.createSign('sha256');
    signer.update(canonicalizedHeaders + 'dkim-signature:' + dkimHeader);
    const signature = signer.sign(privateKey, 'base64');
    
    // Vollständigen DKIM-Header erstellen
    const fullDkimHeader = `DKIM-Signature: ${dkimHeader}; b=${signature}`;
    
    // E-Mail mit DKIM-Header zurückgeben
    return headerSection + '\r\n' + fullDkimHeader + '\r\n\r\n' + bodySection;
  } catch (error) {
    console.error('Fehler bei der DKIM-Signierung:', error);
    return email; // Im Fehlerfall die ursprüngliche E-Mail zurückgeben
  }
}
