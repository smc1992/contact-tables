/**
 * Bounce-Management-System
 * Verarbeitet und verfolgt unzustellbare E-Mails
 */

import { createClient } from '@supabase/supabase-js';

// Bounce-Typen
export enum BounceType {
  HARD = 'hard', // Permanente Fehler (ungültige Adresse)
  SOFT = 'soft', // Temporäre Fehler (voller Posteingang)
  COMPLAINT = 'complaint', // Spam-Beschwerden
  UNKNOWN = 'unknown'
}

// Bounce-Datensatz
export interface BounceRecord {
  email: string;
  type: BounceType;
  reason: string;
  timestamp: Date;
  attempts: number;
}

/**
 * Verarbeitet eine Bounce-Nachricht
 * @param email Die E-Mail-Adresse, die den Bounce verursacht hat
 * @param bounceType Art des Bounces
 * @param reason Grund für den Bounce
 */
export async function processBounce(
  email: string,
  bounceType: BounceType,
  reason: string
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  // Prüfen, ob bereits ein Bounce-Eintrag existiert
  const { data: existingBounce } = await supabase
    .from('email_bounces')
    .select('*')
    .eq('email', email)
    .single();

  if (existingBounce) {
    // Bestehenden Eintrag aktualisieren
    await supabase
      .from('email_bounces')
      .update({
        type: bounceType,
        reason,
        timestamp: new Date().toISOString(),
        attempts: existingBounce.attempts + 1
      })
      .eq('email', email);
  } else {
    // Neuen Eintrag erstellen
    await supabase.from('email_bounces').insert({
      email,
      type: bounceType,
      reason,
      timestamp: new Date().toISOString(),
      attempts: 1
    });
  }

  // Bei Hard Bounces oder zu vielen Soft Bounces den Benutzer als inaktiv markieren
  if (
    bounceType === BounceType.HARD ||
    (bounceType === BounceType.SOFT && existingBounce?.attempts >= 5)
  ) {
    await updateUserEmailStatus(email, false);
  }
}

/**
 * Aktualisiert den E-Mail-Status eines Benutzers
 * @param email Die E-Mail-Adresse des Benutzers
 * @param isActive Gibt an, ob die E-Mail aktiv ist
 */
async function updateUserEmailStatus(
  email: string,
  isActive: boolean
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  // Benutzer in der Datenbank aktualisieren
  await supabase
    .from('profiles')
    .update({ email_active: isActive })
    .eq('email', email);
}

/**
 * Prüft, ob eine E-Mail-Adresse als Bounce markiert ist
 * @param email Die zu prüfende E-Mail-Adresse
 * @returns Bounce-Informationen oder null, wenn kein Bounce vorliegt
 */
export async function checkBounceStatus(
  email: string
): Promise<BounceRecord | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const { data } = await supabase
    .from('email_bounces')
    .select('*')
    .eq('email', email)
    .single();

  return data as BounceRecord | null;
}

/**
 * Entfernt eine E-Mail-Adresse aus der Bounce-Liste
 * @param email Die zu entfernende E-Mail-Adresse
 */
export async function removeBounce(email: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  await supabase.from('email_bounces').delete().eq('email', email);
  await updateUserEmailStatus(email, true);
}
