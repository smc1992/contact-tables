import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

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
    // Kampagne abrufen
    const campaign = await prisma.email_campaigns.findUnique({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Kampagne nicht gefunden' });
    }

    // Statistiken abrufen
    const [recipientStats, clickStats] = await Promise.all([
      // Empfänger-Statistiken
      prisma.$queryRaw`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
          COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened_count,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
          COUNT(*) as total_count
        FROM email_recipients
        WHERE campaign_id = ${id}::uuid
      `,
      // Link-Klick-Statistiken
      prisma.$queryRaw`
        SELECT COUNT(*) as click_count
        FROM email_link_clicks
        WHERE campaign_id = ${id}::uuid
      `
    ]);

    // Link-Statistiken abrufen (gruppiert nach URL)
    const linkStats = await prisma.$queryRaw`
      SELECT link_url as url, COUNT(*) as clicks
      FROM email_link_clicks
      WHERE campaign_id = ${id}::uuid
      GROUP BY link_url
      ORDER BY clicks DESC
    `;

    // Ergebnisse zusammenführen
    const stats = {
      id: campaign.id,
      subject: campaign.subject,
      status: campaign.status,
      created_at: campaign.created_at,
      completed_at: campaign.completed_at,
      recipient_count: Array.isArray(recipientStats) && recipientStats.length > 0 ? Number(recipientStats[0].total_count) : 0,
      sent_count: Array.isArray(recipientStats) && recipientStats.length > 0 ? Number(recipientStats[0].sent_count) : 0,
      opened_count: Array.isArray(recipientStats) && recipientStats.length > 0 ? Number(recipientStats[0].opened_count) : 0,
      failed_count: Array.isArray(recipientStats) && recipientStats.length > 0 ? Number(recipientStats[0].failed_count) : 0,
      click_count: Array.isArray(clickStats) && clickStats.length > 0 ? Number(clickStats[0].click_count) : 0,
      links: Array.isArray(linkStats) ? linkStats.map((link: any) => ({
        url: link.url,
        clicks: Number(link.clicks)
      })) : []
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Fehler bei Kampagnen-Statistiken:', error);
    return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
  }
}
