/**
 * Hilfsfunktionen für das Email-Tracking-System
 */

/**
 * Fügt einen Tracking-Pixel für die Öffnungsverfolgung in eine E-Mail ein
 * 
 * @param html - Der HTML-Inhalt der E-Mail
 * @param recipientId - Die ID des Empfängers
 * @param campaignId - Die ID der Kampagne
 * @returns HTML-Inhalt mit eingefügtem Tracking-Pixel
 */
export function addTrackingPixel(
  html: string,
  recipientId: string,
  campaignId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const trackingUrl = `${baseUrl}/api/admin/emails/track?type=open&rid=${recipientId}&cid=${campaignId}`;
  
  const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;border:0;width:1px;height:1px;" />`;
  
  // Füge den Tracking-Pixel vor dem schließenden </body> Tag ein
  if (html.includes('</body>')) {
    return html.replace('</body>', `${trackingPixel}</body>`);
  }
  
  // Fallback: Füge den Tracking-Pixel am Ende des HTML-Inhalts ein
  return html + trackingPixel;
}

/**
 * Konvertiert alle Links in einer E-Mail zu Tracking-Links
 * 
 * @param html - Der HTML-Inhalt der E-Mail
 * @param recipientId - Die ID des Empfängers
 * @param campaignId - Die ID der Kampagne
 * @returns HTML-Inhalt mit konvertierten Links
 */
export function convertToTrackingLinks(
  html: string,
  recipientId: string,
  campaignId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // Regulärer Ausdruck zum Finden von href-Attributen in Links
  const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  
  // Ersetze alle Links durch Tracking-Links
  return html.replace(linkRegex, (match, url) => {
    const encodedUrl = encodeURIComponent(url);
    const trackingUrl = `${baseUrl}/api/admin/emails/track?type=click&rid=${recipientId}&cid=${campaignId}&link=${encodedUrl}`;
    return `href="${trackingUrl}"`;
  });
}

/**
 * Bereitet eine E-Mail für das Tracking vor, indem Tracking-Pixel und Tracking-Links hinzugefügt werden
 * 
 * @param html - Der HTML-Inhalt der E-Mail
 * @param recipientId - Die ID des Empfängers
 * @param campaignId - Die ID der Kampagne
 * @returns HTML-Inhalt mit Tracking-Funktionen
 */
export function prepareEmailForTracking(
  html: string,
  recipientId: string,
  campaignId: string
): string {
  // Zuerst Links konvertieren
  const htmlWithTrackingLinks = convertToTrackingLinks(html, recipientId, campaignId);
  
  // Dann Tracking-Pixel hinzufügen
  return addTrackingPixel(htmlWithTrackingLinks, recipientId, campaignId);
}

/**
 * Generiert einen HTML-Link für die Abmeldung vom Newsletter
 * 
 * @param recipientId - Die ID des Empfängers
 * @param campaignId - Die ID der Kampagne
 * @returns HTML-Link für die Abmeldung
 */
export function generateUnsubscribeLink(
  recipientId: string,
  campaignId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const unsubscribeUrl = `${baseUrl}/unsubscribe?rid=${recipientId}&cid=${campaignId}`;
  
  return `<a href="${unsubscribeUrl}" style="color:#999999;font-size:12px;text-decoration:underline;">Abmelden</a>`;
}
