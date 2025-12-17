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

  // Rollenprüfung - nur Admins dürfen A/B-Test-Gewinner festlegen
  const role = user.user_metadata?.role;
  if (role !== 'ADMIN' && role !== 'admin') {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  // Test-ID aus der URL extrahieren
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Ungültige Test-ID' });
  }

  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Methode ${req.method} nicht erlaubt` });
  }

  try {
    // Gewinner-ID aus dem Request-Body extrahieren
    const { winner_id } = req.body;
    
    if (!winner_id) {
      return res.status(400).json({ error: 'Keine Gewinner-ID angegeben' });
    }

    // Hauptkampagne abrufen
    const mainTest = await prisma.email_campaigns.findUnique({
      where: { id }
    });

    if (!mainTest) {
      return res.status(404).json({ error: 'A/B-Test nicht gefunden' });
    }

    if (mainTest.status !== 'completed') {
      return res.status(400).json({ error: 'Der Test muss abgeschlossen sein, um einen Gewinner festzulegen' });
    }

    // Prüfen, ob die Gewinner-Variante zum Test gehört
    const winnerVariant = await prisma.email_campaigns.findFirst({
      where: {
        id: winner_id,
        parent_campaign_id: id
      }
    });

    if (!winnerVariant) {
      return res.status(404).json({ error: 'Die angegebene Variante gehört nicht zu diesem Test' });
    }

    // Gewinner festlegen
    await prisma.email_campaigns.update({
      where: { id },
      data: { winner_id }
    });

    // Ergebnis in der A/B-Test-Ergebnistabelle speichern
    // Empfänger- und Statistikdaten für die Gewinnervariante abrufen
    const recipientStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened_count
      FROM email_recipients
      WHERE campaign_id = ${winner_id}::uuid
    `;

    const clickStats = await prisma.$queryRaw`
      SELECT COUNT(*) as click_count
      FROM email_link_clicks
      WHERE campaign_id = ${winner_id}::uuid
    `;

    const stats = Array.isArray(recipientStats) && recipientStats.length > 0 ? recipientStats[0] : { 
      sent_count: 0, 
      opened_count: 0 
    };
    
    const clicks = Array.isArray(clickStats) && clickStats.length > 0 ? 
      Number(clickStats[0].click_count) : 0;

    // Öffnungs- und Klickraten berechnen
    const sentCount = Number(stats.sent_count) || 0;
    const openedCount = Number(stats.opened_count) || 0;
    const openRate = sentCount > 0 ? (openedCount / sentCount) * 100 : 0;
    const clickRate = openedCount > 0 ? (clicks / openedCount) * 100 : 0;

    // Ergebnisse speichern
    await prisma.ab_test_results.createMany({
      data: [
        {
          test_id: id,
          variant_id: winner_id,
          metric: 'open_rate',
          value: openRate
        },
        {
          test_id: id,
          variant_id: winner_id,
          metric: 'click_rate',
          value: clickRate
        }
      ]
    });

    return res.status(200).json({ 
      message: 'Gewinner erfolgreich festgelegt',
      winner_id,
      metrics: {
        open_rate: openRate,
        click_rate: clickRate
      }
    });
  } catch (error) {
    console.error('Fehler beim Festlegen des Gewinners:', error);
    return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
  }
}
