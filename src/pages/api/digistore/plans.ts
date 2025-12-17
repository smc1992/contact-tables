import type { NextApiRequest, NextApiResponse } from 'next';

interface Plan {
  id: string;
  name: string;
  price?: number;
  currency?: string;
  url: string;
}

function withCustomParam(url: string, restaurantId?: string) {
  if (!url) return url;
  const hasQuery = url.includes('?');
  const joiner = hasQuery ? '&' : '?';
  return restaurantId ? `${url}${joiner}custom=${encodeURIComponent(restaurantId)}` : url;
}

async function tryGetProductUrl(apiKey: string, productId: string): Promise<string | undefined> {
  const candidates = [
    `https://www.digistore24.com/api/call/getProduct?product_id=${encodeURIComponent(productId)}`,
  ];
  for (const url of candidates) {
    try {
      const resp = await fetch(url, {
        headers: {
          'X-DS-API-KEY': apiKey,
          'Accept': 'application/json',
        },
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      if (data?.result === 'success') {
        const d = data?.data ?? {};
        const u = d?.buy_url || d?.checkout_url || d?.url || d?.order_form_url;
        if (typeof u === 'string' && u.length > 0) return u;
      }
    } catch (_) {
      // ignore and continue
    }
  }
  return undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const apiKey = process.env.DIGISTORE_API_KEY;
  const restaurantId = (req.query.restaurantId as string) || undefined;

  // Fallback from env if API call is not available or fails
  const basicEnv = process.env.NEXT_PUBLIC_DIGISTORE_PLAN_MONTHLY_URL || process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_MONTHLY_URL || process.env.NEXT_PUBLIC_DIGISTORE_PLAN_BASIC_URL || process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_URL || '';
  const premiumEnv = process.env.NEXT_PUBLIC_DIGISTORE_PLAN_YEARLY_URL || process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_YEARLY_URL || process.env.NEXT_PUBLIC_DIGISTORE_PLAN_PREMIUM_URL || process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_URL || '';

  const fallbackPlans: Plan[] = [
    basicEnv ? { id: 'basic', name: 'Basis', url: withCustomParam(basicEnv, restaurantId) } : undefined,
    premiumEnv ? { id: 'premium', name: 'Premium', url: withCustomParam(premiumEnv, restaurantId) } : undefined,
  ].filter(Boolean) as Plan[];

  if (!apiKey) {
    return res.status(200).json({ plans: fallbackPlans });
  }

  try {
    const resp = await fetch('https://www.digistore24.com/api/call/listProducts', {
      headers: {
        'X-DS-API-KEY': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!resp.ok) {
      return res.status(200).json({ plans: fallbackPlans });
    }

    const data = await resp.json();
    if (!(data?.result === 'success') || !Array.isArray(data?.data?.products)) {
      return res.status(200).json({ plans: fallbackPlans });
    }

    const products = (data.data.products as any[]) || [];

    // Prefer monthly/yearly products by name, otherwise take first two
    const preferred = products.filter((p) => {
      const name = String(p?.name ?? p?.name_de ?? '').toLowerCase();
      return name.includes('monat') || name.includes('jahr');
    });
    const shortlist = (preferred.length >= 2 ? preferred : products).slice(0, 2);

    const plans: Plan[] = [];
    for (let i = 0; i < shortlist.length; i++) {
      const p = shortlist[i];
      const id = String(p?.id ?? p?.product_id ?? `plan-${i + 1}`);
      const name = String(p?.name ?? p?.name_de ?? `Plan ${i + 1}`);
      const price = typeof p?.price === 'number' ? p.price : undefined;
      const currency = typeof p?.currency === 'string' ? p.currency : undefined;

      let url = p?.buy_url || p?.checkout_url || p?.url;
      if (!url && (p?.product_id || p?.id)) {
        // Try detail endpoint for a concrete buy_url
        const detailUrl = await tryGetProductUrl(apiKey, String(p?.product_id ?? p?.id));
        url = detailUrl;
      }
      if (!url && (p?.product_id || p?.id)) {
        // Construct a standard order form URL as a last resort
      url = `https://www.checkout-ds24.com/product/${encodeURIComponent(String(p?.product_id ?? p?.id))}`;
      }
      if (!url) continue;

      plans.push({
        id,
        name,
        price,
        currency,
        url: withCustomParam(url, restaurantId),
      });
    }

    if (plans.length > 0) {
      return res.status(200).json({ plans });
    }

    return res.status(200).json({ plans: fallbackPlans });
  } catch (e) {
    console.warn('Digistore API flow failed, falling back:', e);
    return res.status(200).json({ plans: fallbackPlans });
  }
}