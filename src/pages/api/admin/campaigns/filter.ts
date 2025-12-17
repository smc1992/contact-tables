import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authentifizierung prüfen
  const supabase = createClient({ req, res });
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  // Rollenprüfung - nur Admins dürfen Kampagnen filtern
  const role = user.user_metadata?.role;
  if (role !== 'ADMIN' && role !== 'admin') {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  // Nur GET-Anfragen erlauben
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Methode ${req.method} nicht erlaubt` });
  }

  try {
    // Filter-Parameter aus der Anfrage extrahieren
    const {
      status,
      schedule_type,
      start_date,
      end_date,
      segments,
      min_open_rate,
      max_open_rate,
      min_click_rate,
      max_click_rate,
      search
    } = req.query;

    // Basis-Where-Bedingung erstellen
    const where: any = {};

    // Status-Filter
    if (status) {
      where.status = {
        in: (status as string).split(',')
      };
    }

    // Zeitplan-Filter
    if (schedule_type) {
      where.schedule_type = {
        in: (schedule_type as string).split(',')
      };
    }

    // Datumsbereich-Filter
    if (start_date && end_date) {
      where.created_at = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
    }

    // Suche nach Betreff oder Inhalt
    if (search) {
      where.OR = [
        {
          subject: {
            contains: search as string,
            mode: 'insensitive'
          }
        },
        {
          content: {
            contains: search as string,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Kampagnen abrufen
    const campaigns = await prisma.email_campaigns.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      }
    });

    // Für jede Kampagne die Statistiken abrufen
    const campaignsWithStats = await Promise.all(campaigns.map(async (campaign) => {
      // Empfänger-Statistiken abrufen
      const recipientStats = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as recipient_count,
          COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
          COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened_count
        FROM email_recipients
        WHERE campaign_id = ${campaign.id}::uuid
      `;

      // Link-Klick-Statistiken abrufen
      const clickStats = await prisma.$queryRaw`
        SELECT COUNT(*) as click_count
        FROM email_link_clicks
        WHERE campaign_id = ${campaign.id}::uuid
      `;

      const stats = Array.isArray(recipientStats) && recipientStats.length > 0 ? recipientStats[0] : { 
        recipient_count: 0, 
        sent_count: 0, 
        opened_count: 0 
      };
      
      const clicks = Array.isArray(clickStats) && clickStats.length > 0 ? 
        Number(clickStats[0].click_count) : 0;

      // Öffnungs- und Klickraten berechnen
      const sentCount = Number(stats.sent_count) || 0;
      const openedCount = Number(stats.opened_count) || 0;
      const recipientCount = Number(stats.recipient_count) || 0;
      
      const openRate = sentCount > 0 ? (openedCount / sentCount) * 100 : 0;
      const clickRate = openedCount > 0 ? (clicks / openedCount) * 100 : 0;

      return {
        id: campaign.id,
        subject: campaign.subject,
        status: campaign.status,
        schedule_type: campaign.schedule_type,
        scheduled_at: campaign.scheduled_at,
        recipient_count: recipientCount,
        sent_count: sentCount,
        opened_count: openedCount,
        click_count: clicks,
        open_rate: openRate,
        click_rate: clickRate,
        created_at: campaign.created_at,
        completed_at: campaign.completed_at
      };
    }));

    // Segment-Filter
    let filteredCampaigns = campaignsWithStats;
    
    if (segments) {
      const segmentIds = (segments as string).split(',');
      
      // Kampagnen filtern, die an die angegebenen Segmente gesendet wurden
      const campaignsWithSegments = await Promise.all(filteredCampaigns.map(async (campaign) => {
        // Prüfen, ob die Kampagne an eines der angegebenen Segmente gesendet wurde
        const targetConfig = typeof campaign.target_config === 'string' ? 
          JSON.parse(campaign.target_config) : campaign.target_config;
        
        if (targetConfig && targetConfig.segments) {
          const campaignSegments = Array.isArray(targetConfig.segments) ? 
            targetConfig.segments : [targetConfig.segments];
          
          // Prüfen, ob eines der Kampagnensegmente in den Filtersegmenten enthalten ist
          const hasMatchingSegment = campaignSegments.some((segmentId: string) => 
            segmentIds.includes(segmentId)
          );
          
          return hasMatchingSegment ? campaign : null;
        }
        
        return null;
      }));
      
      filteredCampaigns = campaignsWithSegments.filter(Boolean) as any[];
    }

    // Öffnungsrate-Filter
    if (min_open_rate !== undefined || max_open_rate !== undefined) {
      const minRate = min_open_rate !== undefined ? parseFloat(min_open_rate as string) : 0;
      const maxRate = max_open_rate !== undefined ? parseFloat(max_open_rate as string) : 100;
      
      filteredCampaigns = filteredCampaigns.filter(campaign => 
        campaign.open_rate >= minRate && campaign.open_rate <= maxRate
      );
    }

    // Klickrate-Filter
    if (min_click_rate !== undefined || max_click_rate !== undefined) {
      const minRate = min_click_rate !== undefined ? parseFloat(min_click_rate as string) : 0;
      const maxRate = max_click_rate !== undefined ? parseFloat(max_click_rate as string) : 100;
      
      filteredCampaigns = filteredCampaigns.filter(campaign => 
        campaign.click_rate >= minRate && campaign.click_rate <= maxRate
      );
    }

    return res.status(200).json({ campaigns: filteredCampaigns });
  } catch (error) {
    console.error('Fehler beim Filtern der Kampagnen:', error);
    return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
  }
}
