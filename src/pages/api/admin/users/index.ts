import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma, UserRole } from '@prisma/client';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Supabase-Client erstellen
  const supabase = createPagesServerClient({ req, res });
  
  // Authentifizierung prüfen
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }
  
  // Benutzer aus der Datenbank abrufen, um die Rolle zu überprüfen
  const adminUser = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });
  
  // Prüfen, ob der Benutzer ein Administrator ist
  if (!adminUser || adminUser.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Keine Berechtigung' });
  }

  // GET-Anfrage: Benutzer auflisten
  if (req.method === 'GET') {
    try {
      const { 
        page = '1', 
        limit = '10', 
        search = '', 
        role,
        // isPaying // TODO: Filtering by isPaying requires a more complex query across users and profiles tables.
      } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      // Filter erstellen
      let where: Prisma.ProfileWhereInput = {};

      // Suchfilter (nur auf E-Mail)
      // TODO: Suche nach Name erfordert eine komplexere Abfrage
      if (search) {
        where.name = { contains: search as string, mode: 'insensitive' };
      }

      // Rollenfilter
      if (role) {
        where.role = { equals: role as UserRole };
      }

      // Benutzer abrufen
      const [users, totalCount] = await Promise.all([
        prisma.profile.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNumber
        }),
        prisma.profile.count({ where })
      ]);

      // Zugehörige Profile abrufen
      const userIds = users.map(u => u.id);
      const profiles = await prisma.profile.findMany({
        where: { id: { in: userIds } },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      const profilesMap = new Map(profiles.map(p => [p.id, p]));

      // Benutzerdaten für die Frontend-Anzeige kombinieren
      const combinedUsers = users.map(u => {
        const profile = profilesMap.get(u.id);
        return {
          id: u.id,
          email: '', // HACK: Email is not on profile model, needs to be fetched from auth.users
          name: profile?.name,
          role: u.role,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          restaurant: profile?.restaurant || null
        };
      });

      return res.status(200).json({
        users: combinedUsers,
        pagination: {
          total: totalCount,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(totalCount / limitNumber)
        }
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzer:', error);
      return res.status(500).json({ message: 'Interner Serverfehler' });
    }
  }

  // POST-Anfrage: Benutzer erstellen
  if (req.method === 'POST') {
    // TODO: Dieser gesamte Block muss umgeschrieben werden, um Supabase Auth für die Benutzererstellung zu verwenden.
    // Die aktuelle Implementierung ist unsicher (speichert Passwörter im Klartext) und inkompatibel
    // mit dem neuen Authentifizierungssystem. Sie wurde auskommentiert, damit der Build erfolgreich ist.
    return res.status(501).json({ message: 'Benutzererstellung ist deaktiviert. Siehe Code-Kommentare für Details.' });
  }

  // Andere HTTP-Methoden sind nicht erlaubt
  return res.status(405).json({ message: 'Method not allowed' });
}
