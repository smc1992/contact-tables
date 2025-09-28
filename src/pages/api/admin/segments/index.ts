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

  // Rollenprüfung - nur Admins dürfen Segmente verwalten
  const role = user.user_metadata?.role;
  if (role !== 'ADMIN' && role !== 'admin') {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  // GET-Anfrage: Liste aller Segmente abrufen
  if (req.method === 'GET') {
    try {
      // Alle Segmente abrufen
      const segments = await prisma.user_segments.findMany({
        orderBy: {
          created_at: 'desc'
        }
      });

      // Für jedes Segment die Anzahl der Mitglieder abrufen
      const segmentsWithMemberCount = await Promise.all(segments.map(async (segment) => {
        const memberCount = await prisma.user_segment_members.count({
          where: { segment_id: segment.id }
        });

        return {
          id: segment.id,
          name: segment.name,
          description: segment.description || '',
          criteria: segment.criteria,
          is_dynamic: segment.is_dynamic,
          member_count: memberCount,
          created_at: segment.created_at
        };
      }));

      return res.status(200).json({ segments: segmentsWithMemberCount });
    } catch (error) {
      console.error('Fehler beim Abrufen der Segmente:', error);
      return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
    }
  }

  // POST-Anfrage: Neues Segment erstellen
  else if (req.method === 'POST') {
    try {
      const { 
        name, 
        description, 
        is_dynamic, 
        criteria 
      } = req.body;

      // Segment erstellen
      const segment = await prisma.user_segments.create({
        data: {
          name,
          description,
          is_dynamic,
          criteria,
          created_by: user.id
        }
      });

      // Wenn es ein dynamisches Segment ist, Mitglieder basierend auf Kriterien hinzufügen
      if (is_dynamic) {
        await updateDynamicSegmentMembers(segment.id, criteria);
      }

      return res.status(201).json({ 
        message: 'Segment erfolgreich erstellt',
        segment_id: segment.id
      });
    } catch (error) {
      console.error('Fehler beim Erstellen des Segments:', error);
      return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
    }
  }

  // Andere Methoden nicht erlaubt
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Methode ${req.method} nicht erlaubt` });
  }
}

// Hilfsfunktion zum Aktualisieren der Mitglieder eines dynamischen Segments
async function updateDynamicSegmentMembers(segmentId: string, criteria: any) {
  try {
    const prisma = new PrismaClient();
    
    // Bestehende Mitglieder entfernen
    await prisma.user_segment_members.deleteMany({
      where: { segment_id: segmentId }
    });
    
    // SQL-Abfrage basierend auf den Kriterien erstellen
    let query = `
      SELECT id, email
      FROM profiles
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Engagement-Level-Filter
    if (criteria.engagement_level && criteria.engagement_level !== 'any') {
      let engagementCondition = '';
      
      switch (criteria.engagement_level) {
        case 'high':
          engagementCondition = `
            AND id IN (
              SELECT user_id FROM user_engagement
              GROUP BY user_id
              HAVING COUNT(*) > 10
            )
          `;
          break;
        case 'medium':
          engagementCondition = `
            AND id IN (
              SELECT user_id FROM user_engagement
              GROUP BY user_id
              HAVING COUNT(*) BETWEEN 5 AND 10
            )
          `;
          break;
        case 'low':
          engagementCondition = `
            AND id IN (
              SELECT user_id FROM user_engagement
              GROUP BY user_id
              HAVING COUNT(*) BETWEEN 1 AND 4
            )
          `;
          break;
        case 'inactive':
          engagementCondition = `
            AND id NOT IN (
              SELECT user_id FROM user_engagement
            )
          `;
          break;
      }
      
      query += engagementCondition;
    }
    
    // Letzter Aktivitätsfilter
    if (criteria.last_active_days && criteria.last_active_days > 0) {
      query += `
        AND id IN (
          SELECT user_id FROM user_engagement
          WHERE occurred_at > NOW() - INTERVAL '${criteria.last_active_days} days'
        )
      `;
    }
    
    // E-Mail-Aktivitätsfilter
    if (criteria.email_activity) {
      // Öffnungsrate
      if (criteria.email_activity.open_rate > 0) {
        query += `
          AND id IN (
            SELECT r.recipient_id
            FROM email_recipients r
            WHERE r.opened_at IS NOT NULL
            GROUP BY r.recipient_id
            HAVING COUNT(CASE WHEN r.opened_at IS NOT NULL THEN 1 ELSE NULL END)::float / 
                   COUNT(*)::float * 100 >= $${params.length + 1}
          )
        `;
        params.push(criteria.email_activity.open_rate);
      }
      
      // Klickrate
      if (criteria.email_activity.click_rate > 0) {
        query += `
          AND id IN (
            SELECT r.recipient_id
            FROM email_recipients r
            JOIN email_link_clicks c ON r.recipient_id = c.recipient_id
            GROUP BY r.recipient_id
            HAVING COUNT(DISTINCT c.id)::float / 
                   COUNT(DISTINCT CASE WHEN r.opened_at IS NOT NULL THEN r.id ELSE NULL END)::float * 100 >= $${params.length + 1}
          )
        `;
        params.push(criteria.email_activity.click_rate);
      }
    }

    // Filter: Benutzer, die noch keine E-Mail zu einer Vorlage oder einem Betreff erhalten haben
    if (criteria.email_not_received && (criteria.email_not_received.template_id || criteria.email_not_received.subject_contains)) {
      const conditions: string[] = [];
      if (criteria.email_not_received.template_id) {
        conditions.push(`c.template_id = $${params.length + 1}`);
        params.push(criteria.email_not_received.template_id);
      }
      if (criteria.email_not_received.subject_contains) {
        conditions.push(`c.subject ILIKE $${params.length + 1}`);
        params.push(`%${criteria.email_not_received.subject_contains}%`);
      }

      const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';
      query += `
        AND NOT EXISTS (
          SELECT 1
          FROM email_recipients r
          JOIN email_campaigns c ON c.id = r.campaign_id
          WHERE r.recipient_id = profiles.id
            ${whereClause}
            AND (r.status = 'sent' OR r.opened_at IS NOT NULL)
        )
      `;
    }

    // Tag-Filter
    if (criteria.tags && criteria.tags.length > 0) {
      query += `
        AND id IN (
          SELECT user_id
          FROM user_tag_assignments a
          JOIN user_tags t ON a.tag_id = t.id
          WHERE t.name IN (${criteria.tags.map((_, i: number) => `$${params.length + i + 1}`).join(', ')})
        )
      `;
      params.push(...criteria.tags);
    }
    
    // Abfrage ausführen
    const users = await prisma.$queryRawUnsafe(query, ...params);
    
    // Benutzer zum Segment hinzufügen
    if (Array.isArray(users) && users.length > 0) {
      const memberData = users.map((user: any) => ({
        segment_id: segmentId,
        user_id: user.id,
        score: 1.0 // Standardwert, könnte basierend auf Kriterien angepasst werden
      }));
      
      await prisma.user_segment_members.createMany({
        data: memberData,
        skipDuplicates: true
      });
    }
    
    return true;
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Segmentmitglieder:', error);
    throw error;
  }
}
