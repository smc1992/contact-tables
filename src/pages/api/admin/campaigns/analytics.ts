import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import moment from 'moment';

const prisma = new PrismaClient();

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
    
    // Kampagnen im Zeitraum abrufen
    const campaigns = await prisma.email_campaigns.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Kampagnen-IDs für weitere Abfragen
    const campaignIds = campaigns.map(c => c.id);
    
    // Empfänger-Statistiken abrufen
    const recipientStats = await prisma.$queryRaw`
      SELECT 
        campaign_id,
        COUNT(*) as recipient_count,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened_count
      FROM email_recipients
      WHERE campaign_id IN (${campaignIds})
      GROUP BY campaign_id
    `;
    
    // Link-Klick-Statistiken abrufen
    const clickStats = await prisma.$queryRaw`
      SELECT 
        campaign_id,
        COUNT(*) as click_count
      FROM email_link_clicks
      WHERE campaign_id IN (${campaignIds})
      GROUP BY campaign_id
    `;
    
    // Top Links abrufen
    const topLinks = await prisma.$queryRaw`
      SELECT 
        link_url as url,
        COUNT(*) as clicks
      FROM email_link_clicks
      WHERE campaign_id IN (${campaignIds})
      GROUP BY link_url
      ORDER BY clicks DESC
      LIMIT 20
    `;
    
    // Tägliche Statistiken für den Zeitraum abrufen
    const dailyStats = [];
    let currentDate = moment(startDate);
    const lastDate = moment(endDate);
    
    while (currentDate.isSameOrBefore(lastDate)) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const nextDate = moment(currentDate).add(1, 'days');
      
      // Gesendete E-Mails für diesen Tag
      const sentResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM email_recipients
        WHERE sent_at >= ${currentDate.toDate()}
        AND sent_at < ${nextDate.toDate()}
      `;
      
      // Geöffnete E-Mails für diesen Tag
      const openedResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM email_recipients
        WHERE opened_at >= ${currentDate.toDate()}
        AND opened_at < ${nextDate.toDate()}
      `;
      
      // Klicks für diesen Tag
      const clickedResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM email_link_clicks
        WHERE clicked_at >= ${currentDate.toDate()}
        AND clicked_at < ${nextDate.toDate()}
      `;
      
      dailyStats.push({
        date: dateStr,
        sent: Array.isArray(sentResult) && sentResult.length > 0 ? Number(sentResult[0].count) : 0,
        opened: Array.isArray(openedResult) && openedResult.length > 0 ? Number(openedResult[0].count) : 0,
        clicked: Array.isArray(clickedResult) && clickedResult.length > 0 ? Number(clickedResult[0].count) : 0
      });
      
      currentDate = nextDate;
    }
    
    // Kampagnen-Daten mit Statistiken zusammenführen
    const campaignSummaries = campaigns.map(campaign => {
      const stats = Array.isArray(recipientStats) ? 
        recipientStats.find((s: any) => s.campaign_id === campaign.id) : null;
      
      const clicks = Array.isArray(clickStats) ? 
        clickStats.find((s: any) => s.campaign_id === campaign.id) : null;
      
      return {
        id: campaign.id,
        subject: campaign.subject,
        status: campaign.status,
        recipient_count: stats ? Number(stats.recipient_count) : 0,
        sent_count: stats ? Number(stats.sent_count) : 0,
        opened_count: stats ? Number(stats.opened_count) : 0,
        click_count: clicks ? Number(clicks.click_count) : 0,
        created_at: campaign.created_at
      };
    });
    
    // Gesamtstatistiken berechnen
    const totalSent = campaignSummaries.reduce((sum, c) => sum + c.sent_count, 0);
    const totalOpened = campaignSummaries.reduce((sum, c) => sum + c.opened_count, 0);
    const totalClicked = campaignSummaries.reduce((sum, c) => sum + c.click_count, 0);
    
    const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const avgClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
    
    // Ergebnisse zusammenführen
    const result = {
      campaigns: campaignSummaries,
      dailyStats,
      topLinks: Array.isArray(topLinks) ? topLinks.map((link: any) => ({
        url: link.url,
        clicks: Number(link.clicks)
      })) : [],
      totalStats: {
        total_campaigns: campaigns.length,
        total_sent: totalSent,
        total_opened: totalOpened,
        total_clicked: totalClicked,
        avg_open_rate: parseFloat(avgOpenRate.toFixed(1)),
        avg_click_rate: parseFloat(avgClickRate.toFixed(1))
      }
    };
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Fehler bei Kampagnen-Analysen:', error);
    return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
  }
}
