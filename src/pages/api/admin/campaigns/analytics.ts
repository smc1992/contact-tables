import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import moment from 'moment';

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

  // Rollenprüfung - nur Admins dürfen Analysen abrufen
  const role = user.user_metadata?.role;
  if (role !== 'ADMIN' && role !== 'admin') {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  try {
    // Datumsbereich aus der Anfrage extrahieren
    const { start, end } = req.query;

    const startDate = start ? new Date(start as string) : moment().subtract(30, 'days').toDate();
    const endDate = end ? new Date(end as string) : new Date();

    const admin = createAdminClient();

    // Kampagnen im Zeitraum via Supabase abrufen
    const { data: campaigns, error: campaignsError } = await admin
      .from('email_campaigns')
      .select('id, subject, status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (campaignsError) {
      throw campaignsError;
    }

    const campaignIds = (campaigns || []).map(c => c.id);

    // Tägliche Statistiken für den Zeitraum via Supabase zählen
    const dailyStats: Array<{ date: string; sent: number; opened: number; clicked: number }> = [];
    let currentDate = moment(startDate);
    const lastDate = moment(endDate);

    while (currentDate.isSameOrBefore(lastDate)) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const nextDate = moment(currentDate).add(1, 'days');

      const { count: sent } = await admin
        .from('email_recipients')
        .select('id', { count: 'exact', head: true })
        .gte('sent_at', currentDate.toISOString())
        .lt('sent_at', nextDate.toISOString());

      const { count: opened } = await admin
        .from('email_recipients')
        .select('id', { count: 'exact', head: true })
        .gte('opened_at', currentDate.toISOString())
        .lt('opened_at', nextDate.toISOString());

      const { count: clicked } = await admin
        .from('email_link_clicks')
        .select('id', { count: 'exact', head: true })
        .gte('clicked_at', currentDate.toISOString())
        .lt('clicked_at', nextDate.toISOString());

      dailyStats.push({
        date: dateStr,
        sent: sent || 0,
        opened: opened || 0,
        clicked: clicked || 0
      });

      currentDate = nextDate;
    }

    // Kampagnen-Zusammenfassungen mit Zählungen via Supabase erstellen
    const campaignSummaries = await Promise.all((campaigns || []).map(async (campaign) => {
      const { count: recipient_count } = await admin
        .from('email_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id);

      const { count: sent_count } = await admin
        .from('email_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('status', 'sent');

      const { count: opened_count } = await admin
        .from('email_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .not('opened_at', 'is', null);

      const { count: click_count } = await admin
        .from('email_link_clicks')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id);

      return {
        id: campaign.id,
        subject: campaign.subject,
        status: campaign.status,
        recipient_count: recipient_count || 0,
        sent_count: sent_count || 0,
        opened_count: opened_count || 0,
        click_count: click_count || 0,
        created_at: campaign.created_at
      };
    }));

    // Top-Links via Supabase abrufen und in JS aggregieren
    let topLinks: Array<{ url: string; clicks: number }> = [];
    if (campaignIds.length > 0) {
      const { data: clicksData } = await admin
        .from('email_link_clicks')
        .select('link_url, campaign_id, clicked_at')
        .in('campaign_id', campaignIds)
        .gte('clicked_at', startDate.toISOString())
        .lte('clicked_at', endDate.toISOString());

      const map = new Map<string, number>();
      (clicksData || []).forEach(row => {
        const url = row.link_url as string;
        map.set(url, (map.get(url) || 0) + 1);
      });
      topLinks = Array.from(map.entries())
        .map(([url, clicks]) => ({ url, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 20);
    }

    // Gesamtstatistiken berechnen
    const totalSent = campaignSummaries.reduce((sum, c) => sum + c.sent_count, 0);
    const totalOpened = campaignSummaries.reduce((sum, c) => sum + c.opened_count, 0);
    const totalClicked = campaignSummaries.reduce((sum, c) => sum + c.click_count, 0);

    const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const avgClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

    const result = {
      campaigns: campaignSummaries,
      dailyStats,
      topLinks,
      totalStats: {
        total_campaigns: (campaigns || []).length,
        total_sent: totalSent,
        total_opened: totalOpened,
        total_clicked: totalClicked,
        avg_open_rate: parseFloat(avgOpenRate.toFixed(1)),
        avg_click_rate: parseFloat(avgClickRate.toFixed(1))
      }
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Fehler bei Kampagnen-Analysen (Supabase):', error);
    return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
  }
}
