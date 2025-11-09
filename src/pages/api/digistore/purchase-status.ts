import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

/**
 * Admin-Endpoint: Liest den Zahlungs-/Bestellstatus aus Digistore24 via getPurchase.
 *
 * Query-Parameter:
 * - purchase_id: string (erforderlich) – Digistore24 Bestell-/Auftrags-ID
 * - currency: string (optional) – z. B. "EUR" (zeigt zusätzlich Umrechnung an)
 *
 * Antwort:
 * - Gibt einen verdichteten Status zurück (billing_status, msg, amount, items, buyer, urls)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Admin-Authentifizierung via Supabase (Server-Client)
  try {
    const supabase = createClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }
    const role: string | undefined = user.user_metadata?.role || user.app_metadata?.role;
    if (role !== 'ADMIN' && role !== 'STAFF') {
      return res.status(403).json({ error: 'Nur Admin/Staff dürfen Digistore-Status abrufen' });
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

  const purchaseId = typeof req.query.purchase_id === 'string' ? req.query.purchase_id : undefined;
  const currency = typeof req.query.currency === 'string' ? req.query.currency : undefined;
  if (!purchaseId) {
    return res.status(400).json({ error: 'purchase_id ist erforderlich' });
  }

  const url = new URL('https://www.digistore24.com/api/call/getPurchase');
  url.searchParams.set('purchase_id', purchaseId);
  if (currency) url.searchParams.set('currency', currency);

  try {
    const resp = await fetch(url.toString(), {
      headers: {
        'X-DS-API-KEY': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Digistore API Fehler (${resp.status})` });
    }

    const data = await resp.json();
    if (data?.result !== 'success' || !data?.data) {
      return res.status(200).json({ result: data?.result ?? 'error', message: data?.message ?? 'Unbekannter Fehler' });
    }

    const d = data.data;
    // Verdichtete Antwort zusammenstellen
    const summary = {
      purchase_id: d?.purchase_id || purchaseId,
      created_at: d?.created_at || d?.order_date || null,
      amount: d?.amount ?? null,
      currency: d?.currency ?? currency ?? null,
      billing_type: d?.billing_type ?? null,
      billing_type_msg: d?.billing_type_msg ?? null,
      billing_status: d?.billing_status ?? null,
      billing_status_msg: d?.billing_status_msg ?? null,
      renew_url: d?.renew_url ?? null,
      receipt_url: d?.receipt_url ?? d?.invoice_url ?? null,
      buyer: {
        name: d?.buyer?.name ?? null,
        email: d?.buyer?.email ?? null,
        country: d?.buyer?.country ?? null,
      },
      items: Array.isArray(d?.items) ? d.items.map((it: any) => ({
        product_id: it?.product_id ?? it?.id ?? null,
        product_name: it?.product_name ?? it?.name ?? null,
        quantity: it?.quantity ?? it?.count ?? 1,
        variant_key: it?.variant_key ?? null,
        variant_name: it?.variant_name ?? null,
      })) : [],
    };

    return res.status(200).json({ result: 'success', summary, raw: d });
  } catch (e: any) {
    console.error('Fehler beim Abruf getPurchase:', e);
    return res.status(500).json({ error: 'Interner Serverfehler beim Digistore-Abruf' });
  }
}