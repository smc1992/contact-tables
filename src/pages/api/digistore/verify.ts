import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

/**
 * Verify-Endpoint: Prüft Digistore24 Transaktionen und Bestellungen und erkennt "bezahlt".
 * Optional: schaltet Restaurant/Nutzer frei (contractStatus ACTIVE) bei bestätigter Zahlung.
 *
 * Query-Parameter (mindestens einer Identifikator):
 * - restaurantId?: string – bevorzugt, wenn Checkout mit custom=<restaurantId> erfolgt
 * - email?: string – Fallback, wenn kein custom mitgegeben wurde
 * - purchase_id?: string – direkte Abfrage einer konkreten Bestellung
 * - currency?: string – z. B. "EUR" (zeigt zusätzlich Umrechnung an)
 * - update?: '1' | 'true' – bei Zahlung Restaurant freischalten
 *
 * Antwort:
 * - status: { isPaid, billingStatus, billingStatusMsg, billingType, amount, currency, paymentMethod? }
 * - matched: { purchaseId, productId, buyerEmail, custom }
 * - urls: { receiptUrl?, renewUrl? }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Auth: nur ADMIN/STAFF
  try {
    const supabase = createClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }
    const role: string | undefined = user.user_metadata?.role || user.app_metadata?.role;
    if (role !== 'ADMIN' && role !== 'STAFF') {
      return res.status(403).json({ error: 'Nur Admin/Staff dürfen den Verify-Endpoint nutzen' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Supabase-Authentifizierung fehlgeschlagen' });
  }

  const apiKey = process.env.DIGISTORE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'DIGISTORE_API_KEY fehlt in der Umgebungskonfiguration',
      hint: 'Bitte .env.local mit DIGISTORE_API_KEY=<Ihr Schlüssel> konfigurieren',
    });
  }
  // Fix: Header-Typing für fetch (HeadersInit erwartet string-Werte)
  const dsHeaders: Record<string, string> = {
    'X-DS-API-KEY': apiKey as string,
    'Accept': 'application/json',
  };

  const restaurantId = typeof req.query.restaurantId === 'string' ? req.query.restaurantId : undefined;
  const email = typeof req.query.email === 'string' ? req.query.email : undefined;
  const purchaseId = typeof req.query.purchase_id === 'string' ? req.query.purchase_id : undefined;
  const currency = typeof req.query.currency === 'string' ? req.query.currency : undefined;
  const doUpdate = req.query.update === '1' || req.query.update === 'true';

  // Hilfsfunktionen
  async function callDs(url: string) {
    const resp = await fetch(url, { headers: dsHeaders });
    if (!resp.ok) throw new Error(`Digistore API Fehler (${resp.status})`);
    const json = await resp.json();
    if (json?.result !== 'success') {
      const msg = json?.message || 'Unbekannter Fehler';
      throw new Error(`Digistore API result != success: ${msg}`);
    }
    return json.data;
  }

  function extractEmail(d: any): string | undefined {
    return d?.buyer_email || d?.customer_email || d?.email || d?.payer_email || d?.buyer?.email || undefined;
  }
  function extractCustom(d: any): string | undefined {
    return d?.custom || d?.sub_id || d?.order_custom || undefined;
  }

  // Schritt 1: Falls purchase_id gegeben ist, hole direkten Status
  let matched: { purchaseId?: string; productId?: string | number; buyerEmail?: string; custom?: string } = {};
  let summary: any = undefined;
  try {
    if (purchaseId) {
      const url = new URL('https://www.digistore24.com/api/call/getPurchase');
      url.searchParams.set('purchase_id', purchaseId);
      if (currency) url.searchParams.set('currency', currency);
      const d = await callDs(url.toString());
      matched = {
        purchaseId: d?.purchase_id || purchaseId,
        productId: (Array.isArray(d?.items) && d.items[0]?.product_id) || undefined,
        buyerEmail: extractEmail(d),
        custom: extractCustom(d),
      };
      summary = d;
    } else {
      // Schritt 2: Liste Transaktionen, filtere nach restaurantId (custom) oder email
      const listUrl = new URL('https://www.digistore24.com/api/call/listTransactions');
      // Optional: currency beeinflusst nur Anzeige/Umrechnung, nicht Filter
      if (currency) listUrl.searchParams.set('currency', currency);
      const listData = await callDs(listUrl.toString());
      const transactions: any[] = Array.isArray(listData?.transactions) ? listData.transactions : Array.isArray(listData) ? listData : [];

      // Erlaubte Produkte analog Webhook
      const ALLOWED_PRODUCTS = new Set([640621, 640542, 644296]);

      // Jüngste passende Transaktion finden
      const candidates = transactions.filter((t) => {
        const tEmail = extractEmail(t);
        const tCustom = extractCustom(t);
        const pid = Number(t?.product_id || t?.id);
        const idOk = ALLOWED_PRODUCTS.has(pid);
        const matchCustom = restaurantId ? tCustom === restaurantId : true;
        const matchEmail = email ? (tEmail && tEmail.toLowerCase() === email.toLowerCase()) : true;
        return idOk && matchCustom && matchEmail;
      });

      // Sortiere nach Datum absteigend, falls Feld vorhanden
      candidates.sort((a, b) => {
        const da = new Date(a?.created_at || a?.order_date || 0).getTime();
        const db = new Date(b?.created_at || b?.order_date || 0).getTime();
        return db - da;
      });

      const best = candidates[0];
      if (!best) {
        return res.status(404).json({ error: 'Keine passende Transaktion gefunden', filter: { restaurantId, email } });
      }

      const bestPurchaseId = best?.purchase_id || best?.id || best?.order_id;
      if (!bestPurchaseId) {
        return res.status(404).json({ error: 'Transaktion gefunden, aber purchase_id fehlt', best });
      }

      // Hole Detailstatus zur gefundenen purchase_id
      const url = new URL('https://www.digistore24.com/api/call/getPurchase');
      url.searchParams.set('purchase_id', String(bestPurchaseId));
      if (currency) url.searchParams.set('currency', currency);
      const d = await callDs(url.toString());

      matched = {
        purchaseId: d?.purchase_id || String(bestPurchaseId),
        productId: (Array.isArray(d?.items) && d.items[0]?.product_id) || (best?.product_id || best?.id),
        buyerEmail: extractEmail(d) || extractEmail(best),
        custom: extractCustom(d) || extractCustom(best),
      };
      summary = d;
    }
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Fehler beim Digistore-Abruf' });
  }

  // Status ableiten
  const billingStatus: string | undefined = summary?.billing_status || summary?.status;
  const billingStatusMsg: string | undefined = summary?.billing_status_msg || undefined;
  const billingType: string | undefined = summary?.billing_type || undefined; // single_payment | subscription
  const amount: number | undefined = typeof summary?.amount === 'number' ? summary.amount : undefined;
  const curr: string | undefined = summary?.currency || currency || undefined;
  const paymentMethod: string | undefined = summary?.payment_method || undefined; // falls verfügbar

  const msgLower = (billingStatusMsg || '').toLowerCase();
  const isPaid = (
    billingStatus === 'paid' || billingStatus === 'completed' || billingStatus === 'confirmed'
  ) || (
    msgLower && !msgLower.includes('abgebrochen') && !msgLower.includes('aborted') && !msgLower.includes('failed') && !msgLower.includes('missed')
  );

  const urls = {
    receiptUrl: summary?.receipt_url || summary?.invoice_url || undefined,
    renewUrl: summary?.renew_url || undefined,
  };

  // Optional: Freischalten
  if (doUpdate && isPaid && matched?.custom) {
    try {
      const supabase = createClient({ req, res });
      // Restaurant aktiv/visible setzen
      const { error: rErr } = await supabase
        .from('restaurants')
        .update({ contractStatus: 'ACTIVE', isActive: true, isVisible: true })
        .eq('id', matched.custom);
      if (rErr) {
        console.warn('Aktualisierung Restaurant fehlgeschlagen:', rErr);
      }
      // Optionale Vertrags-Tabelle aktualisieren, wenn vorhanden
      await supabase
        .from('contracts')
        .update({ status: 'ACTIVE', cancellationDate: null })
        .eq('restaurantId', matched.custom);
    } catch (_) {
      // Fehler beim Update nicht fatal für den Verify-Call
    }
  }

  return res.status(200).json({
    result: 'success',
    status: { isPaid, billingStatus, billingStatusMsg, billingType, amount, currency: curr, paymentMethod },
    matched,
    urls,
    raw: summary,
  });
}