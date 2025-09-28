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

  // Rollenprüfung - nur Admins dürfen Kampagnen-Statistiken abrufen
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

    // Kampagne abrufen (Supabase)
    const { data: campaign, error: campaignError } = await admin
      .from('email_campaigns')
      .select('id, subject, status, created_at, completed_at')
      .eq('id', id)
      .single();

    if (campaignError) {
      if (campaignError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Kampagne nicht gefunden' });
      }
      throw campaignError;
    }

    // Zählungen (Supabase)
    const { count: totalCount } = await admin
      .from('email_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id);

    const { count: sentCount } = await admin
      .from('email_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id)
      .eq('status', 'sent');

    const { count: openedCount } = await admin
      .from('email_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id)
      .not('opened_at', 'is', null);

    const { count: failedCount } = await admin
      .from('email_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id)
      .eq('status', 'failed');

    const { count: clickCount } = await admin
      .from('email_link_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id);

    // Linkspezifische Klick-Statistik (Supabase + Aggregation)
    const { data: linkRows } = await admin
      .from('email_link_clicks')
      .select('link_url')
      .eq('campaign_id', id);

    const linkMap = new Map<string, number>();
    (linkRows || []).forEach(r => {
      const url = r.link_url as string;
      linkMap.set(url, (linkMap.get(url) || 0) + 1);
    });
    const linkStats = Array.from(linkMap.entries())
      .map(([url, clicks]) => ({ url, clicks }))
      .sort((a, b) => b.clicks - a.clicks);

    // Ergebnisse zusammenführen
    const stats = {
      id: campaign.id,
      subject: campaign.subject,
      status: campaign.status,
      created_at: campaign.created_at,
      completed_at: campaign.completed_at,
      recipient_count: totalCount,
      sent_count: sentCount,
      opened_count: openedCount,
      failed_count: failedCount,
      click_count: clickCount,
      links: linkStats
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Fehler bei Kampagnen-Statistiken:', error);
    return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
  }
}
