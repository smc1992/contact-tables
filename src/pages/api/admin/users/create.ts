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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const guard = await ensureAdmin(req, res);
  if (!guard) return;

  try {
    const {
      email,
      password,
      role,
      first_name,
      last_name,
      phone,
      restaurant_name,
      restaurant_isVisible,
      admin_canManageUsers,
      admin_canManageSettings,
    } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' });
    }

    const adminSupabase = createAdminClient();

    // 1) Auth User anlegen
    const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        first_name,
        last_name,
        phone,
      },
    });
    if (createErr || !created?.user) {
      return res.status(500).json({ error: 'Fehler beim Erstellen des Users', details: createErr?.message });
    }

    const userId = created.user.id;

    // 2) Prisma Profile anlegen
    await prisma.profile.upsert({
      where: { id: userId },
      update: {
        role: toEnumRole(role),
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        role: toEnumRole(role),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 3) Supabase-Tabellenfelder (profiles) pflegen: first_name, last_name, phone
    await adminSupabase.from('profiles').upsert({
      id: userId,
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    // 4) Rollen-spezifisch
    const lowerRole = (role || '').toLowerCase();
    if (lowerRole === 'restaurant') {
      await prisma.restaurant.upsert({
        where: { userId: userId },
        update: {
          name: restaurant_name ?? undefined,
          isVisible: typeof restaurant_isVisible === 'boolean' ? restaurant_isVisible : undefined,
          updatedAt: new Date(),
        },
        create: {
          userId: userId,
          name: restaurant_name || 'Neues Restaurant',
          isVisible: !!restaurant_isVisible,
        },
      });
    } else if (lowerRole === 'admin') {
      await prisma.admin.upsert({
        where: { id: userId },
        update: {
          canManageUsers: !!admin_canManageUsers,
          canManageSettings: !!admin_canManageSettings,
          updatedAt: new Date(),
        },
        create: {
          id: userId,
          canManageUsers: !!admin_canManageUsers,
          canManageSettings: !!admin_canManageSettings,
        },
      });
    }

    return res.status(200).json({ ok: true, id: userId });
  } catch (e: any) {
    console.error('Admin users create error:', e);
    return res.status(500).json({ error: 'Interner Serverfehler', details: e?.message || String(e) });
  }
}
