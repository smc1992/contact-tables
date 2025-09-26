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

  // Rollenprüfung - nur Admins dürfen A/B-Tests verwalten
  const role = user.user_metadata?.role;
  if (role !== 'ADMIN' && role !== 'admin') {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  // GET-Anfrage: Liste aller A/B-Tests abrufen
  if (req.method === 'GET') {
    try {
      // Hauptkampagnen (A/B-Tests) abrufen
      const mainTests = await prisma.email_campaigns.findMany({
        where: {
          is_ab_test: true,
          parent_campaign_id: null // Nur Hauptkampagnen, keine Varianten
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      // Für jeden Test die Varianten abrufen
      const testsWithVariants = await Promise.all(mainTests.map(async (test) => {
        // Varianten abrufen
        const variants = await prisma.email_campaigns.findMany({
          where: {
            parent_campaign_id: test.id
          }
        });

        // Empfänger- und Statistikdaten für jede Variante abrufen
        const variantsWithStats = await Promise.all(variants.map(async (variant) => {
          const recipientStats = await prisma.$queryRaw`
            SELECT 
              COUNT(*) as recipient_count,
              COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
              COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened_count
            FROM email_recipients
            WHERE campaign_id = ${variant.id}::uuid
          `;

          const clickStats = await prisma.$queryRaw`
            SELECT COUNT(*) as click_count
            FROM email_link_clicks
            WHERE campaign_id = ${variant.id}::uuid
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
          const openRate = sentCount > 0 ? (openedCount / sentCount) * 100 : 0;
          const clickRate = openedCount > 0 ? (clicks / openedCount) * 100 : 0;

          return {
            id: variant.id,
            name: variant.variant_name || `Variante ${variant.id.substring(0, 4)}`,
            subject: variant.subject,
            content: variant.content,
            recipient_count: Number(stats.recipient_count) || 0,
            sent_count: sentCount,
            opened_count: openedCount,
            click_count: clicks,
            open_rate: openRate,
            click_rate: clickRate,
            is_winner: test.winner_id === variant.id
          };
        }));

        // Gesamtzahl der Empfänger berechnen
        const totalRecipients = variantsWithStats.reduce((sum, v) => sum + v.recipient_count, 0);

        return {
          id: test.id,
          name: test.subject,
          status: test.status,
          created_at: test.created_at,
          variants: variantsWithStats,
          winner_id: test.winner_id,
          metric: test.variant_type === 'subject' ? 'open_rate' : 'click_rate',
          total_recipients: totalRecipients
        };
      }));

      return res.status(200).json({ tests: testsWithVariants });
    } catch (error) {
      console.error('Fehler beim Abrufen der A/B-Tests:', error);
      return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
    }
  }

  // POST-Anfrage: Neuen A/B-Test erstellen
  else if (req.method === 'POST') {
    try {
      const { 
        name, 
        variant_type, 
        metric, 
        variants: variantCount, 
        test_size, 
        base_campaign_id 
      } = req.body;

      // Basiskampagne abrufen
      const baseCampaign = await prisma.email_campaigns.findUnique({
        where: { id: base_campaign_id }
      });

      if (!baseCampaign) {
        return res.status(404).json({ error: 'Basiskampagne nicht gefunden' });
      }

      // Hauptkampagne für den A/B-Test erstellen
      const mainTest = await prisma.email_campaigns.create({
        data: {
          subject: name,
          content: baseCampaign.content,
          status: 'draft',
          sent_by: user.id,
          is_ab_test: true,
          variant_type,
          target_config: baseCampaign.target_config
        }
      });

      // Varianten erstellen
      const variantPromises = [];
      for (let i = 0; i < variantCount; i++) {
        const variantName = String.fromCharCode(65 + i); // A, B, C, ...
        
        variantPromises.push(
          prisma.email_campaigns.create({
            data: {
              subject: i === 0 ? baseCampaign.subject : `${baseCampaign.subject} (Variante ${variantName})`,
              content: baseCampaign.content,
              status: 'draft',
              sent_by: user.id,
              is_ab_test: true,
              parent_campaign_id: mainTest.id,
              variant_name: variantName,
              variant_type,
              target_config: baseCampaign.target_config
            }
          })
        );
      }

      await Promise.all(variantPromises);

      return res.status(201).json({ 
        message: 'A/B-Test erfolgreich erstellt',
        test_id: mainTest.id
      });
    } catch (error) {
      console.error('Fehler beim Erstellen des A/B-Tests:', error);
      return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
    }
  }

  // Andere Methoden nicht erlaubt
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Methode ${req.method} nicht erlaubt` });
  }
}
