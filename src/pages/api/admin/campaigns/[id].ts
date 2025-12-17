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

  // Kampagnen-ID aus der URL extrahieren
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Ungültige Kampagnen-ID' });
  }

  try {
    // GET: Kampagne abrufen
    if (req.method === 'GET') {
      const campaign = await prisma.email_campaigns.findUnique({
        where: { id },
        include: {
          batches: {
            orderBy: { created_at: 'desc' }
          },
          _count: {
            select: {
              recipients: true,
              batches: true
            }
          }
        }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Kampagne nicht gefunden' });
      }

      return res.status(200).json(campaign);
    }
    
    // PUT: Kampagne aktualisieren
    else if (req.method === 'PUT') {
      const {
        subject,
        content,
        schedule_type,
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

      // Kampagne aktualisieren
      const updatedCampaign = await prisma.email_campaigns.update({
        where: { id },
        data: {
          subject,
          content,
          schedule_type,
          scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
          recurring_config: recurring_config || null,
          target_config: target_config || undefined,
          template_id
        }
      });

      return res.status(200).json(updatedCampaign);
    }
    
    // DELETE: Kampagne löschen
    else if (req.method === 'DELETE') {
      // Prüfen, ob die Kampagne bereits aktiv ist
      const campaign = await prisma.email_campaigns.findUnique({
        where: { id }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Kampagne nicht gefunden' });
      }

      // Aktive oder abgeschlossene Kampagnen können nicht gelöscht werden
      if (campaign.status === 'active' || campaign.status === 'completed') {
        return res.status(400).json({ 
          error: 'Aktive oder abgeschlossene Kampagnen können nicht gelöscht werden',
          status: campaign.status
        });
      }

      // Kampagne löschen (kaskadiert zu Batches und Recipients)
      await prisma.email_campaigns.delete({
        where: { id }
      });

      return res.status(200).json({ success: true, message: 'Kampagne erfolgreich gelöscht' });
    }
    
    // Methode nicht erlaubt
    else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Methode ${req.method} nicht erlaubt` });
    }
  } catch (error) {
    console.error('Fehler bei Kampagnen-API:', error);
    return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
  }
}
