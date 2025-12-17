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
      // Alle Segmente inkl. Member-Count per SQL abrufen
      const segments: Array<{
        id: string;
        name: string;
        description: string | null;
        criteria: any;
        is_dynamic: boolean;
        created_at: Date;
        member_count: number;
      }> = await prisma.$queryRawUnsafe(
        `
        SELECT s.id,
               s.name,
               s.description,
               s.criteria,
               s.is_dynamic,
               s.created_at,
               (
                 SELECT COUNT(*)
                 FROM user_segment_members m
                 WHERE m.segment_id = s.id
               ) AS member_count
        FROM user_segments s
        ORDER BY s.created_at DESC
        `
      );

      // Beschreibung auf leeren String normalisieren
      const normalized = segments.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        criteria: s.criteria,
        is_dynamic: s.is_dynamic,
        member_count: Number(s.member_count) || 0,
        created_at: s.created_at
      }));

      return res.status(200).json({ segments: normalized });
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

      // Eingabevalidierung
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name ist erforderlich' });
      }

      const dynamicFlag = typeof is_dynamic === 'boolean' ? is_dynamic : true;
      const criteriaJson = criteria ? JSON.stringify(criteria) : JSON.stringify({});

      // Segment per SQL erstellen und ID zurückgeben
      const inserted: Array<{ id: string }> = await prisma.$queryRawUnsafe(
        `
        INSERT INTO user_segments (name, description, is_dynamic, criteria, created_by)
        VALUES ($1, $2, $3, $4::jsonb, $5)
        RETURNING id
        `,
        name,
        description ?? null,
        dynamicFlag,
        criteriaJson,
        user.id
      );

      const segmentId = inserted[0]?.id;

      // Wenn es ein dynamisches Segment ist, Mitglieder basierend auf Kriterien hinzufügen
      if (segmentId && dynamicFlag) {
        await updateDynamicSegmentMembers(segmentId, criteria || {});
      }

      return res.status(201).json({ 
        message: 'Segment erfolgreich erstellt',
        segment_id: segmentId
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
    const prismaLocal = new PrismaClient();

    // Bestehende Mitglieder entfernen (SQL)
    await prismaLocal.$executeRawUnsafe(
      `DELETE FROM user_segment_members WHERE segment_id = $1`,
      segmentId
    );

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
    const users: Array<{ id: string; email: string | null }> = await prismaLocal.$queryRawUnsafe(query, ...params);

    // Benutzer zum Segment hinzufügen
    if (Array.isArray(users) && users.length > 0) {
      // Einfügen in kleinen Batches, um Konflikte zu ignorieren
      for (const u of users) {
        await prismaLocal.$executeRawUnsafe(
          `
          INSERT INTO user_segment_members (segment_id, user_id, score)
          VALUES ($1, $2, $3)
          ON CONFLICT (segment_id, user_id) DO NOTHING
          `,
          segmentId,
          u.id,
          1.0
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Segmentmitglieder:', error);
    throw error;
  }
}
