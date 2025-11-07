import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Optionaler Tarif-Typ: monthly | yearly | default
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const defaultUrl = process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_URL;
  const monthlyUrl = process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_MONTHLY_URL;
  const yearlyUrl = process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_YEARLY_URL;

  const baseUrl = type === 'monthly' ? monthlyUrl
    : type === 'yearly' ? yearlyUrl
    : defaultUrl;

  if (!baseUrl) {
    return res.status(500).json({ error: 'Digistore Produkt-URL ist nicht konfiguriert' });
  }

  try {
    const supabase = createClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Sicherstellen, dass der Benutzer ein Restaurant-Betreiber ist
    const role = user.user_metadata?.role || user.app_metadata?.role;
    if (role !== 'RESTAURANT') {
      return res.status(403).json({ error: 'Nur Restaurant-Betreiber können den Checkout starten' });
    }

    // Restaurant des Benutzers ermitteln
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant nicht gefunden' });
    }

    // Digistore-Checkout-URL mit eindeutiger Zuordnung über `custom=<restaurantId>`
    const separator = baseUrl.includes('?') ? '&' : '?';
    const checkoutUrl = `${baseUrl}${separator}custom=${encodeURIComponent(restaurant.id)}`;

    return res.status(200).json({ url: checkoutUrl });
  } catch (err: any) {
    console.error('Fehler beim Generieren der Digistore-Checkout-URL:', err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}