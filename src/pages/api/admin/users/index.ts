import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma, UserRole } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Supabase-Client erstellen
  const supabase = createClient({ req, res });
  
  // Authentifizierung prüfen
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }
  
  // Prüfen, ob der Benutzer ein Administrator ist
  if (user.user_metadata?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Keine Berechtigung' });
  }

  if (req.method === 'GET') {
    try {
      const {
        page = '1',
        limit = '10',
        search = '',
        role,
      } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      // 1. Prisma-Filter erstellen
      const where: Prisma.ProfileWhereInput = {};
      if (search) {
        where.name = { contains: search as string, mode: 'insensitive' };
      }
      if (role) {
        where.role = { equals: role as UserRole };
      }

      // 2. Gefilterte Profile und Gesamtzahl von Prisma abrufen
      const [profiles, totalCount] = await prisma.$transaction([
        prisma.profile.findMany({
          where,
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNumber,
        }),
        prisma.profile.count({ where }),
      ]);

      // 3. E-Mails der Benutzer von Supabase Auth abrufen
      // Hinweis: Dies ruft bis zu 1000 Benutzer ab. Für größere Mengen ist eine Paginierung erforderlich.
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers({
        perPage: 1000, 
      });

      if (authError) throw authError;

      const authUsersMap = new Map(authUsers.map(u => [u.id, u]));

      // 4. Profildaten mit Auth-Daten (E-Mail) kombinieren
      const combinedUsers = profiles.map(profile => {
        const authUser = authUsersMap.get(profile.id);
        return {
          id: profile.id,
          email: authUser?.email || 'N/A',
          name: profile.name,
          role: profile.role,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          restaurant: profile.restaurant || null,
        };
      });

      return res.status(200).json({
        users: combinedUsers,
        pagination: {
          total: totalCount,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(totalCount / limitNumber),
        },
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
