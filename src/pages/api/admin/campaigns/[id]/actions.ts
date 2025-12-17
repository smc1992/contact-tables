import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

// Hilfsfunktion zum Erstellen von Empfängern für eine Kampagne
async function createRecipientsForCampaign(campaignId: string, targetConfig: any) {
  try {
    // Zielgruppe bestimmen
    const segmentType = targetConfig?.segment_type || 'all';
    
    // Empfänger basierend auf der Zielgruppe erstellen
    if (segmentType === 'all') {
      // Alle Benutzer als Empfänger hinzufügen
      const users = await prisma.$queryRaw`
        SELECT id, email FROM users
      `;
      
      // Empfänger erstellen
      if (Array.isArray(users) && users.length > 0) {
        await prisma.email_recipients.createMany({
          data: users.map((user: any) => ({
            campaign_id: campaignId,
            recipient_id: user.id,
            recipient_email: user.email,
            status: 'pending'
          })),
          skipDuplicates: true
        });
      }
      
    } else if (segmentType === 'tag' && targetConfig.tag_ids?.length > 0) {
      // Benutzer mit bestimmten Tags als Empfänger hinzufügen
      const users = await prisma.$queryRaw`
        SELECT u.id, u.email 
        FROM users u
        JOIN user_tags ut ON u.id = ut.user_id
        WHERE ut.tag_id IN (${Prisma.join(targetConfig.tag_ids)})
      `;
      
      // Empfänger erstellen
      if (Array.isArray(users) && users.length > 0) {
        await prisma.email_recipients.createMany({
          data: users.map((user: any) => ({
            campaign_id: campaignId,
            recipient_id: user.id,
            recipient_email: user.email,
            status: 'pending'
          })),
          skipDuplicates: true
        });
      }
      
    } else if (segmentType === 'external' && targetConfig.external_emails?.length > 0) {
      // Externe E-Mail-Adressen als Empfänger hinzufügen
      await prisma.$executeRaw`
        INSERT INTO email_recipients (id, campaign_id, recipient_email, status)
        SELECT 
          gen_random_uuid(), 
          ${campaignId}::uuid, 
          email, 
          'pending'
        FROM unnest(${targetConfig.external_emails}::text[]) AS email
        ON CONFLICT DO NOTHING
      `;
    }
    
    return true;
  } catch (error) {
    console.error('Fehler beim Erstellen der Empfänger:', error);
    return false;
  }
}

// Nach Empfänger-Erstellung: dynamische Segmente mit Kriterium „noch keine E-Mail erhalten“ aktualisieren
async function refreshEmailNotReceivedSegmentsForCampaign(campaignId: string) {
  try {
    const campaignRows: any[] = await prisma.$queryRaw`
      SELECT id, subject, template_id FROM email_campaigns WHERE id = ${campaignId}::uuid
    `;
    const campaign = Array.isArray(campaignRows) && campaignRows.length > 0 ? campaignRows[0] : null;
    if (!campaign) return;

    const segments: any[] = await prisma.$queryRaw`
      SELECT id, is_dynamic, criteria FROM user_segments WHERE is_dynamic = true
    `;

    for (const seg of segments) {
      let criteria: any = seg.criteria;
      try {
        if (typeof criteria === 'string') criteria = JSON.parse(criteria);
      } catch {}

      const enr = criteria?.email_not_received;
      if (!enr) continue;

      const templateMatch = enr.template_id && campaign.template_id && String(enr.template_id) === String(campaign.template_id);
      const subjectMatch = enr.subject_contains && campaign.subject && String(campaign.subject).toLowerCase().includes(String(enr.subject_contains).toLowerCase());
      if (!templateMatch && !subjectMatch) continue;

      const templateId: string | null = enr.template_id || null;
      const subjectContains: string | null = enr.subject_contains || null;

      // Mitglieder neu berechnen: alle Nutzer, für die keine gesendete E-Mail zu Vorlage/Betreff existiert
      const whereParts: string[] = [];
      if (templateId) {
        whereParts.push(`ec2.template_id = '${templateId}'`);
      }
      if (subjectContains) {
        const like = subjectContains.replace(/'/g, "''");
        whereParts.push(`ec2.subject ILIKE '%${like}%'`);
      }
      const matchClause = whereParts.length > 0 ? `AND ( ${whereParts.join(' OR ')} )` : '';

      await prisma.$executeRawUnsafe(`
        DELETE FROM user_segment_members WHERE segment_id = '${seg.id}';
        INSERT INTO user_segment_members (segment_id, user_id)
        SELECT '${seg.id}'::uuid, u.id
        FROM users u
        WHERE NOT EXISTS (
          SELECT 1
          FROM email_recipients er2
          JOIN email_campaigns ec2 ON ec2.id = er2.campaign_id
          WHERE er2.recipient_id = u.id
            AND er2.status IN ('sent','opened','clicked')
            ${matchClause}
        );
      `);
    }
  } catch (err) {
    console.error('Fehler beim Aktualisieren dynamischer Segmente (nicht erhalten):', err);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Methode ${req.method} nicht erlaubt` });
  }

  // Authentifizierung prüfen
  const supabase = createClient({ req, res });
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  // Rollenprüfung - nur Admins dürfen Kampagnen verwalten
  const role = user.user_metadata?.role;
  if (role !== 'ADMIN' && role !== 'admin') {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  // Kampagnen-ID aus der URL extrahieren
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Ungültige Kampagnen-ID' });
  }

  // Aktion aus dem Request-Body extrahieren
  const { action } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Keine Aktion angegeben' });
  }

  try {
    // Kampagne abrufen
    const campaign = await prisma.email_campaigns.findUnique({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Kampagne nicht gefunden' });
    }

    // Aktionen verarbeiten
    switch (action) {
      case 'schedule':
        // Kampagne planen
        if (campaign.status !== 'draft') {
          return res.status(400).json({ error: 'Nur Entwürfe können geplant werden' });
        }
        
        // Kampagnen-Details abrufen
        const campaignDetails = await prisma.$queryRaw`
          SELECT schedule_type, scheduled_at FROM email_campaigns WHERE id = ${id}::uuid
        `;
        
        const scheduleInfo = Array.isArray(campaignDetails) && campaignDetails.length > 0 ? campaignDetails[0] : null;
        
        if (!scheduleInfo) {
          return res.status(404).json({ error: 'Kampagnendetails nicht gefunden' });
        }
        
        if (scheduleInfo.schedule_type === 'immediate') {
          return res.status(400).json({ error: 'Sofortige Kampagnen können nicht geplant werden' });
        }

        if (scheduleInfo.schedule_type === 'scheduled' && !scheduleInfo.scheduled_at) {
          return res.status(400).json({ error: 'Kein Zeitpunkt für die geplante Kampagne angegeben' });
        }

        await prisma.email_campaigns.update({
          where: { id },
          data: { status: 'scheduled' }
        });

        return res.status(200).json({ 
          success: true, 
          message: 'Kampagne erfolgreich geplant',
          scheduledAt: campaign.scheduled_at
        });

      case 'start':
        // Kampagne sofort starten
        if (campaign.status !== 'draft' && campaign.status !== 'scheduled' && campaign.status !== 'paused') {
          return res.status(400).json({ 
            error: 'Nur Entwürfe, geplante oder pausierte Kampagnen können gestartet werden' 
          });
        }

        // Status auf 'active' setzen
        await prisma.email_campaigns.update({
          where: { id },
          data: { 
            status: 'active',
            // Bei sofortigen Kampagnen einen Batch erstellen
            ...(campaign.schedule_type === 'immediate' ? {} : {})
          }
        });

        // Bei sofortigen Kampagnen den Batch-Prozess starten
        const startData = await prisma.$queryRaw`
          SELECT schedule_type, target_config FROM email_campaigns WHERE id = ${id}::uuid
        `;
        
        const startInfo = Array.isArray(startData) && startData.length > 0 ? startData[0] : null;
        
        if (startInfo && startInfo.schedule_type === 'immediate') {
          // Batch erstellen
          const batch = await prisma.email_batches.create({
            data: {
              campaign_id: id,
              status: 'pending'
            }
          });
          
          // Empfänger für die Kampagne erstellen
          await createRecipientsForCampaign(id, startInfo.target_config);

          // Dynamische „Nicht erhalten“-Segmente aktualisieren
          await refreshEmailNotReceivedSegmentsForCampaign(id);

          // Batch-Verarbeitung starten (asynchron)
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/emails/process-batch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-token': process.env.ADMIN_API_TOKEN || ''
            },
            body: JSON.stringify({ batch_id: batch.id })
          }).catch(error => {
            console.error('Fehler beim Starten des Batch-Prozesses:', error);
          });
        }

        return res.status(200).json({ 
          success: true, 
          message: 'Kampagne erfolgreich gestartet' 
        });

      case 'pause':
        // Kampagne pausieren
        if (campaign.status !== 'active') {
          return res.status(400).json({ error: 'Nur aktive Kampagnen können pausiert werden' });
        }

        await prisma.email_campaigns.update({
          where: { id },
          data: { status: 'paused' }
        });

        return res.status(200).json({ 
          success: true, 
          message: 'Kampagne erfolgreich pausiert' 
        });

      case 'resume':
        // Kampagne fortsetzen
        if (campaign.status !== 'paused') {
          return res.status(400).json({ error: 'Nur pausierte Kampagnen können fortgesetzt werden' });
        }

        await prisma.email_campaigns.update({
          where: { id },
          data: { status: 'active' }
        });

        return res.status(200).json({ 
          success: true, 
          message: 'Kampagne erfolgreich fortgesetzt' 
        });

      case 'cancel':
        // Kampagne abbrechen
        if (campaign.status !== 'scheduled' && campaign.status !== 'active' && campaign.status !== 'paused') {
          return res.status(400).json({ 
            error: 'Nur geplante, aktive oder pausierte Kampagnen können abgebrochen werden' 
          });
        }

        await prisma.email_campaigns.update({
          where: { id },
          data: { status: 'draft' }
        });

        return res.status(200).json({ 
          success: true, 
          message: 'Kampagne erfolgreich abgebrochen' 
        });

      case 'duplicate':
        // Kampagne duplizieren
        // Kampagnen-Details für Duplizierung abrufen
        const campaignToDuplicate = await prisma.$queryRaw`
          SELECT subject, content, schedule_type, recurring_config, target_config, template_id 
          FROM email_campaigns WHERE id = ${id}::uuid
        `;
        
        const duplicateData = Array.isArray(campaignToDuplicate) && campaignToDuplicate.length > 0 ? campaignToDuplicate[0] as any : null;
        
        if (!duplicateData) {
          return res.status(404).json({ error: 'Kampagnendetails nicht gefunden' });
        }
        
        const newCampaign = await prisma.email_campaigns.create({
          data: {
            subject: `${duplicateData.subject} (Kopie)`,
            content: duplicateData.content,
            status: 'draft',
            schedule_type: duplicateData.schedule_type,
            recurring_config: duplicateData.recurring_config,
            target_config: duplicateData.target_config,
            template_id: duplicateData.template_id,
            sent_by: user.id
          }
        });

        return res.status(200).json({ 
          success: true, 
          message: 'Kampagne erfolgreich dupliziert',
          campaign: newCampaign
        });

      default:
        return res.status(400).json({ error: 'Ungültige Aktion' });
    }
  } catch (error) {
    console.error('Fehler bei Kampagnen-Aktion:', error);
    return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
  }
}
