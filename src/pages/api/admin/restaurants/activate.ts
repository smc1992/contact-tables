import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, ContractStatus } from '@prisma/client';
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Supabase Admin-Client (Service Role) – optional, falls nicht konfiguriert, wird nur Prisma aktualisiert
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey)
  ? createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const supabase = createSupabaseServerClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (user.user_metadata?.role !== 'ADMIN' && user.user_metadata?.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
  }

  try {
    // Restaurant inkl. Profil laden (für evtl. Rollen-Update)
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: { profile: true, contract: true },
    });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    // Aktivieren: Vertrag auf ACTIVE, sichtbar/aktiv setzen, Annahmedatum setzen
    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        contractStatus: ContractStatus.ACTIVE,
        isActive: true,
        isVisible: true,
        contractAcceptedAt: restaurant.contractAcceptedAt ?? new Date(),
      },
      include: { profile: true },
    });

    // Optional: Vertragsdatensatz spiegeln
    try {
      const existingContract = await prisma.contract.findUnique({ where: { restaurantId: id } });
      if (existingContract) {
        await prisma.contract.update({
          where: { restaurantId: id },
          data: { status: ContractStatus.ACTIVE, cancellationDate: null },
        });
      }
    } catch (_) {
      // Vertragsupdate-Fehler nicht fatal
    }

    // Supabase spiegeln (Restaurants-Tabelle + optional Benutzerrolle)
    if (supabaseAdmin) {
      try {
        const { error: supErr } = await supabaseAdmin
          .from('restaurants')
          .update({
            contract_status: 'ACTIVE',
            is_active: true,
            is_visible: true,
            contract_accepted_at: (updated.contractAcceptedAt ?? new Date()).toISOString(),
          })
          .eq('id', id);
        if (supErr) {
          console.error('Fehler beim Supabase-Update (restaurants):', supErr);
        }
        try {
          const { error: ctErr } = await supabaseAdmin
            .from('contact_tables')
            .update({ is_public: true })
            .eq('restaurant_id', id);
          if (ctErr) {
            console.error('Fehler beim Supabase-Update (contact_tables):', ctErr);
          }
        } catch (e) {
          console.error('Unerwarteter Fehler beim Supabase-Update (contact_tables):', e);
        }
      } catch (e) {
        console.error('Unerwarteter Fehler beim Supabase-Update (restaurants):', e);
      }

      // Benutzerrolle auf RESTAURANT setzen (falls Profil vorhanden)
      const supabaseAuthUserId = updated?.profile?.id;
      if (supabaseAuthUserId) {
        try {
          const { error: roleErr } = await supabaseAdmin.auth.admin.updateUserById(
            supabaseAuthUserId,
            { user_metadata: { role: 'RESTAURANT' } }
          );
          if (roleErr) {
            console.error('Fehler beim Setzen der Supabase-Benutzerrolle:', roleErr);
          }
        } catch (e) {
          console.error('Unerwarteter Fehler beim Setzen der Supabase-Benutzerrolle:', e);
        }
      }
    } else {
      console.warn('Supabase Admin-Client nicht konfiguriert – Spiegelung in Supabase wird übersprungen.');
    }

    return res.status(200).json({ message: 'Restaurant aktiviert', restaurant: updated });
  } catch (error) {
    console.error('Fehler bei der Aktivierung des Restaurants:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}