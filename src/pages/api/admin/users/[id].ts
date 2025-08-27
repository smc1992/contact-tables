import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const ensureAdmin = async (req: NextApiRequest, res: NextApiResponse) => {
  const supabase = createClient({ req, res });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    res.status(401).json({ error: 'Nicht authentifiziert' });
    return null;
  }
  const role = user.user_metadata?.role;
  if (role !== 'admin' && role !== 'ADMIN') {
    res.status(403).json({ error: 'Keine Berechtigung' });
    return null;
  }
  return { supabaseUser: user };
};

function toEnumRole(role: string | undefined): UserRole {
  switch ((role || '').toUpperCase()) {
    case 'ADMIN': return UserRole.ADMIN;
    case 'RESTAURANT': return UserRole.RESTAURANT;
    case 'CUSTOMER': return UserRole.CUSTOMER;
    default: return UserRole.CUSTOMER;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const guard = await ensureAdmin(req, res);
  if (!guard) return;

  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Ungültige ID' });
  }

  try {
    const adminSupabase = createAdminClient();

    if (req.method === 'GET') {
      // Details laden
      const { data: authData, error: getErr } = await adminSupabase.auth.admin.getUserById(id);
      if (getErr) return res.status(500).json({ error: 'Fehler beim Laden des Users', details: getErr.message });

      const profile = await prisma.profile.findUnique({ where: { id } });
      const restaurant = await prisma.restaurant.findUnique({ where: { userId: id } });
      const admin = await prisma.admin.findUnique({ where: { id } });

      return res.status(200).json({ user: authData?.user || null, profile, restaurant, admin });
    }

    if (req.method === 'PUT') {
      const { role, first_name, last_name, phone, is_active,
        restaurant_name, restaurant_isVisible,
        admin_canManageUsers, admin_canManageSettings } = req.body || {};

      // 1) auth: Metadaten + Aktiv/Inaktiv
      const updates: any = { user_metadata: { role, first_name, last_name, phone } };
      if (typeof is_active === 'boolean') {
        updates.ban_duration = is_active ? 'none' : '1000 years'; // ban to deactivate
      }
      const { error: updErr } = await adminSupabase.auth.admin.updateUserById(id, updates);
      if (updErr) return res.status(500).json({ error: 'Fehler beim Aktualisieren des Users', details: updErr.message });

      // 2) profile (Prisma): Rolle
      await prisma.profile.upsert({
        where: { id },
        update: {
          role: toEnumRole(role),
          updatedAt: new Date(),
        },
        create: {
          id,
          role: toEnumRole(role),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // 3) Supabase-Tabellenfelder (profiles): first_name, last_name, phone
      const { error: upsertProfileError } = await adminSupabase
        .from('profiles')
        .upsert({
          id,
          first_name: first_name || null,
          last_name: last_name || null,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      if (upsertProfileError) return res.status(500).json({ error: 'Fehler beim Aktualisieren des Profils', details: upsertProfileError.message });

      // 4) Rollen-spezifisch
      const targetRole = (role || '').toLowerCase();
      if (targetRole === 'restaurant') {
        await prisma.restaurant.upsert({
          where: { userId: id },
          update: {
            name: restaurant_name ?? undefined,
            isVisible: typeof restaurant_isVisible === 'boolean' ? restaurant_isVisible : undefined,
            updatedAt: new Date(),
          },
          create: {
            userId: id,
            name: restaurant_name || 'Neues Restaurant',
            isVisible: !!restaurant_isVisible,
          }
        });
        // Falls Admin-Datensatz existiert und Rolle nicht mehr admin ist -> löschen
        await prisma.admin.deleteMany({ where: { id } });
      } else if (targetRole === 'admin') {
        await prisma.admin.upsert({
          where: { id },
          update: {
            canManageUsers: !!admin_canManageUsers,
            canManageSettings: !!admin_canManageSettings,
            updatedAt: new Date(),
          },
          create: {
            id,
            canManageUsers: !!admin_canManageUsers,
            canManageSettings: !!admin_canManageSettings,
          }
        });
        // Restaurant ggf. entfernen
        await prisma.restaurant.deleteMany({ where: { userId: id } });
      } else {
        // Weder admin noch restaurant: beides aufräumen
        await prisma.admin.deleteMany({ where: { id } });
        await prisma.restaurant.deleteMany({ where: { userId: id } });
      }

      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      // Löschen: erst Profile (cascade), dann auth
      await prisma.profile.delete({ where: { id } }).catch(() => undefined);
      const { error: delErr } = await adminSupabase.auth.admin.deleteUser(id);
      if (delErr) return res.status(500).json({ error: 'Fehler beim Löschen des Users', details: delErr.message });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e: any) {
    console.error('Admin users [id] error:', e);
    return res.status(500).json({ error: 'Interner Serverfehler', details: e?.message || String(e) });
  }
}
