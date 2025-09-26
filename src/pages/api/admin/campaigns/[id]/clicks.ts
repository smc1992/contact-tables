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

  // Rollenprüfung - nur Admins dürfen Link-Klicks abrufen
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
    // Kampagne prüfen
    const campaign = await prisma.email_campaigns.findUnique({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Kampagne nicht gefunden' });
    }

    // Link-Klicks abrufen
    const clicks = await prisma.email_link_clicks.findMany({
      where: { campaign_id: id },
      select: {
        id: true,
        recipient_email: true,
        link_url: true,
        link_id: true,
        clicked_at: true,
        user_agent: true
      },
      orderBy: { clicked_at: 'desc' }
    });

    return res.status(200).json({ clicks });
  } catch (error) {
    console.error('Fehler beim Abrufen der Link-Klicks:', error);
    return res.status(500).json({ error: 'Serverfehler', details: (error as Error).message });
  }
}
