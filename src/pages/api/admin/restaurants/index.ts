import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Optionaler Supabase Admin-Client zum Spiegeln von Löschungen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey)
  ? createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { status, page = '1', limit = '10' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        
        const where = status ? {
          contractStatus: status as any, 
        } : {};

        const [restaurants, total] = await Promise.all([
          prisma.restaurant.findMany({
            where,
            include: {
              profile: {
                select: {
                  name: true,
                },
              },
              contract: true,
              _count: {
                select: {
                  events: true,
                },
              },
            },
            skip,
            take: parseInt(limit as string),
            orderBy: {
              createdAt: 'desc',
            },
          }),
          prisma.restaurant.count({ where }),
        ]);

        res.status(200).json({
          restaurants,
          pagination: {
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
            currentPage: parseInt(page as string),
            perPage: parseInt(limit as string),
          },
        });
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    case 'PATCH':
      try {
        const { id } = req.query;
        const {
          isVisible,
          contractStatus,
          contractStartDate,
          trialEndDate,
        } = req.body;

        if (!id) {
          return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
        }

        const restaurant = await prisma.restaurant.update({
          where: { id: id as string },
          data: {
            ...(typeof isVisible === 'boolean' && { isVisible }),
            ...(contractStatus && { contractStatus }),
            ...(contractStartDate && { contractStartDate: new Date(contractStartDate) }),
            ...(trialEndDate && { trialEndDate: new Date(trialEndDate) }),
          },
          include: {
            profile: {
              select: {
                name: true,
              },
            },
            contract: true,
          },
        });

        res.status(200).json(restaurant);
      } catch (error) {
        console.error('Error updating restaurant:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
        }

        await prisma.$transaction([
          prisma.event.deleteMany({
            where: { restaurantId: id as string },
          }),
          prisma.contract.deleteMany({
            where: { restaurantId: id as string },
          }),
          prisma.restaurant.delete({
            where: { id: id as string },
          }),
        ]);

        // Supabase-Spiegelung (falls Service Role verfügbar)
        if (supabaseAdmin) {
          try {
            // payment_events löschen
            const { error: evErr } = await supabaseAdmin
              .from('payment_events')
              .delete()
              .eq('restaurant_id', id as string);
            if (evErr) console.warn('Supabase payment_events Delete-Fehler:', evErr);

            // contracts löschen
            const { error: cErr } = await supabaseAdmin
              .from('contracts')
              .delete()
              .eq('restaurant_id', id as string);
            if (cErr) console.warn('Supabase contracts Delete-Fehler:', cErr);

            // restaurant löschen
            const { error: rErr } = await supabaseAdmin
              .from('restaurants')
              .delete()
              .eq('id', id as string);
            if (rErr) console.warn('Supabase restaurants Delete-Fehler:', rErr);
          } catch (e) {
            console.warn('Supabase-Spiegelung beim Löschen fehlgeschlagen:', e);
          }
        }

        res.status(204).end();
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}