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

  // Rollenprüfung - nur Admins dürfen Kampagnen verwalten
  const role = user.user_metadata?.role;
  if (role !== 'ADMIN' && role !== 'admin') {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  try {
    // GET: Alle Kampagnen abrufen
    if (req.method === 'GET') {
      const campaigns = await prisma.email_campaigns.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: {
              recipients: true,
              batches: true
            }
          }
        }
      });

      return res.status(200).json({ campaigns });
    }
    
    // POST: Neue Kampagne erstellen
    else if (req.method === 'POST') {
      const {
        subject,
        content,
        schedule_type = 'immediate',
        scheduled_at,
        recurring_config,
        target_config,
        template_id
      } = req.body;

      // Validierung
      if (!subject || !content) {
        return res.status(400).json({ error: 'Betreff und Inhalt sind erforderlich' });
      }

      // Zeitplanung validieren
      if (schedule_type === 'scheduled' && !scheduled_at) {
        return res.status(400).json({ error: 'Zeitpunkt ist für geplante Kampagnen erforderlich' });
      }

      if (schedule_type === 'recurring' && !recurring_config) {
        return res.status(400).json({ error: 'Konfiguration ist für wiederkehrende Kampagnen erforderlich' });
      }

      // Kampagne erstellen
      const campaign = await prisma.email_campaigns.create({
        data: {
          subject,
          content,
          status: 'draft',
          schedule_type,
          scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
          recurring_config: recurring_config || null,
          target_config: target_config || { segment_type: 'all' },
          template_id,
          sent_by: user.id
        }
      });

      return res.status(201).json({ campaign });
    }
    
    // Methode nicht erlaubt
    else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Methode ${req.method} nicht erlaubt` });
    }
  } catch (error) {
    console.error('Fehler bei Kampagnen-API:', error);
    return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
  }
}
