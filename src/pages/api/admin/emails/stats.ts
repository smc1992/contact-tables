import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';
import { withAdminAuth } from '@/backend/middleware/withAdminAuth';

interface StatsResponse {
  ok: boolean;
  message?: string;
  data?: any;
}

/**
 * API-Route zum Abrufen detaillierter Email-Tracking-Statistiken
 * 
 * Diese Route liefert detaillierte Statistiken zu Email-Kampagnen,
 * einschließlich Öffnungsraten, Klickraten und anderen Metriken.
 * 
 * Query-Parameter:
 * - campaignId: (optional) ID einer bestimmten Kampagne
 * - period: (optional) Zeitraum für die Statistiken ('day', 'week', 'month', 'year')
 * - page: (optional) Seitennummer für Pagination
 * - pageSize: (optional) Anzahl der Einträge pro Seite
 */
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse>,
  userId: string
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    const adminClient = createAdminClient();
    
    // Parameter aus der Anfrage extrahieren
    const campaignId = req.query.campaignId as string;
    const period = req.query.period as string || 'month';
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    
    // Berechne Offset für Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Zeitraum für die Abfrage bestimmen
    let timeFilter = '';
    const now = new Date();
    
    switch (period) {
      case 'day':
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        timeFilter = `created_at >= '${yesterday.toISOString()}'`;
        break;
      case 'week':
        const lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 7);
        timeFilter = `created_at >= '${lastWeek.toISOString()}'`;
        break;
      case 'year':
        const lastYear = new Date(now);
        lastYear.setFullYear(now.getFullYear() - 1);
        timeFilter = `created_at >= '${lastYear.toISOString()}'`;
        break;
      case 'month':
      default:
        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        timeFilter = `created_at >= '${lastMonth.toISOString()}'`;
        break;
    }
    
    // Basis-Query für Kampagnen
    let query = adminClient
      .from('email_campaigns')
      .select(`
        id, 
        subject, 
        created_at,
        completed_at,
        status,
        sent_count,
        failed_count,
        skipped_count,
        profiles!email_campaigns_sent_by_fkey (email, user_metadata),
        email_recipients (
          id, 
          status, 
          tracking_data,
          sent_at,
          updated_at
        )
      `, { count: 'exact' });
    
    // Filter nach Kampagnen-ID, falls angegeben
    if (campaignId) {
      query = query.eq('id', campaignId);
    } else {
      // Zeitfilter nur anwenden, wenn keine spezifische Kampagne angefragt wird
      query = query.filter('created_at', 'gte', timeFilter.split("'")[1]);
    }
    
    // Sortierung und Pagination
    const { data: campaigns, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Error fetching email stats:', error);
      return res.status(500).json({ 
        ok: false, 
        message: `Error fetching email stats: ${error.message}` 
      });
    }
    
    // Verarbeite die Daten, um detaillierte Statistiken zu berechnen
    const processedData = campaigns?.map(campaign => {
      const recipients = campaign.email_recipients || [];
      const total = recipients.length;
      const sent = recipients.filter(r => r.status === 'sent' || r.status === 'opened' || r.status === 'clicked').length;
      const opened = recipients.filter(r => r.status === 'opened' || r.status === 'clicked').length;
      const clicked = recipients.filter(r => r.status === 'clicked').length;
      const failed = recipients.filter(r => r.status === 'failed').length;
      const pending = recipients.filter(r => r.status === 'pending').length;
      const skipped = recipients.filter(r => r.status === 'skipped').length;
      
      // Berechne Öffnungs- und Klickraten
      const openRate = sent > 0 ? (opened / sent) * 100 : 0;
      const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
      const clickThroughRate = sent > 0 ? (clicked / sent) * 100 : 0;
      
      // Berechne durchschnittliche Zeit bis zur Öffnung
      let avgTimeToOpen = null;
      const openTimes = recipients
        .filter(r => r.status === 'opened' || r.status === 'clicked')
        .filter(r => r.tracking_data?.opened_at && r.sent_at)
        .map(r => {
          const openTime = new Date(r.tracking_data.opened_at).getTime();
          const sentTime = new Date(r.sent_at).getTime();
          return (openTime - sentTime) / 1000; // Zeit in Sekunden
        });
      
      if (openTimes.length > 0) {
        avgTimeToOpen = openTimes.reduce((sum, time) => sum + time, 0) / openTimes.length;
      }
      
      // Sammle die am häufigsten geklickten Links
      const clickedLinks: Record<string, number> = {};
      recipients
        .filter(r => r.status === 'clicked' && r.tracking_data?.clicked_links)
        .forEach(r => {
          (r.tracking_data.clicked_links || []).forEach((link: { url: string }) => {
            const url = link.url;
            clickedLinks[url] = (clickedLinks[url] || 0) + 1;
          });
        });
      
      // Sortiere die Links nach Klickanzahl
      const topLinks = Object.entries(clickedLinks)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([url, clicks]) => ({ url, clicks }));
      
      // Format sender info
      const sender = campaign.profiles && Array.isArray(campaign.profiles) && campaign.profiles.length > 0 ? {
        email: campaign.profiles[0].email,
        name: campaign.profiles[0].user_metadata?.first_name 
          ? `${campaign.profiles[0].user_metadata.first_name} ${campaign.profiles[0].user_metadata.last_name || ''}`
          : 'Admin'
      } : { email: 'Unknown', name: 'Unknown' };
      
      // Berechne die Dauer der Kampagne
      let duration = null;
      if (campaign.completed_at && campaign.created_at) {
        const start = new Date(campaign.created_at).getTime();
        const end = new Date(campaign.completed_at).getTime();
        duration = (end - start) / 1000; // Zeit in Sekunden
      }
      
      return {
        id: campaign.id,
        subject: campaign.subject,
        created_at: campaign.created_at,
        completed_at: campaign.completed_at,
        status: campaign.status,
        sender,
        duration,
        stats: {
          total,
          sent,
          opened,
          clicked,
          failed,
          pending,
          skipped,
          openRate: parseFloat(openRate.toFixed(2)),
          clickRate: parseFloat(clickRate.toFixed(2)),
          clickThroughRate: parseFloat(clickThroughRate.toFixed(2)),
          avgTimeToOpen: avgTimeToOpen ? parseFloat(avgTimeToOpen.toFixed(2)) : null,
          topLinks
        }
      };
    });
    
    // Berechne Gesamtstatistiken über alle Kampagnen
    let overallStats = null;
    
    if (processedData && processedData.length > 0) {
      const totalEmails = processedData.reduce((sum, campaign) => sum + campaign.stats.total, 0);
      const totalSent = processedData.reduce((sum, campaign) => sum + campaign.stats.sent, 0);
      const totalOpened = processedData.reduce((sum, campaign) => sum + campaign.stats.opened, 0);
      const totalClicked = processedData.reduce((sum, campaign) => sum + campaign.stats.clicked, 0);
      
      overallStats = {
        totalCampaigns: processedData.length,
        totalEmails,
        totalSent,
        totalOpened,
        totalClicked,
        avgOpenRate: totalSent > 0 ? parseFloat(((totalOpened / totalSent) * 100).toFixed(2)) : 0,
        avgClickRate: totalOpened > 0 ? parseFloat(((totalClicked / totalOpened) * 100).toFixed(2)) : 0,
        avgClickThroughRate: totalSent > 0 ? parseFloat(((totalClicked / totalSent) * 100).toFixed(2)) : 0
      };
    }
    
    return res.status(200).json({
      ok: true,
      message: 'Email statistics retrieved successfully',
      data: {
        campaigns: processedData,
        overallStats,
        pagination: {
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('Error processing email stats request:', error);
    return res.status(500).json({
      ok: false,
      message: `Error processing email stats request: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
