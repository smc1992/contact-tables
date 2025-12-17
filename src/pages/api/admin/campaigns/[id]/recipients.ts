import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createAdminClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur GET-Anfragen erlauben
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Methode ${req.method} nicht erlaubt` });
  }

  // Authentifizierung prüfen
  const supabase = createClient({ req, res });
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  // Rollenprüfung - nur Admins dürfen Empfänger abrufen
  const role = user.user_metadata?.role;
  if (role !== 'ADMIN' && role !== 'admin') {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  // Kampagnen-ID aus der URL extrahieren
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Ungültige Kampagnen-ID' });
  }

  try {
    const admin = createAdminClient();

    // Kampagne prüfen (Supabase)
    const { data: campaign, error: campaignError } = await admin
      .from('email_campaigns')
      .select('id')
      .eq('id', id as string)
      .maybeSingle();

    if (campaignError) throw campaignError;
    if (!campaign) {
      return res.status(404).json({ error: 'Kampagne nicht gefunden' });
    }

    // Empfänger via Supabase abrufen
    const { data: recipients, error: recError } = await admin
      .from('email_recipients')
      .select('id, recipient_email, status, sent_at, opened_at')
      .eq('campaign_id', id as string)
      .order('recipient_email', { ascending: true });

    if (recError) throw recError;

    return res.status(200).json({ recipients: recipients || [] });
  } catch (error) {
    console.error('Fehler beim Abrufen der Empfänger:', error);
    return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
  }
}
