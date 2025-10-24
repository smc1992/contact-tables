import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, ContractStatus } from '@prisma/client';
import crypto from 'crypto';
import { buffer } from 'micro';

export const config = { api: { bodyParser: false } };

const prisma = new PrismaClient();

function verifyShaSign(params: Record<string, string>): boolean {
  const secret = process.env.DIGISTORE_POSTBACK_SECRET;
  if (!secret) {
    // In development, allow if no secret configured
    return true;
  }

  const received = params['sha_sign'];
  if (!received) {
    return false;
  }

  // Build canonical string per Digistore24 spec:
  // - Exclude 'sha_sign'
  // - Sort keys case-insensitively
  // - Skip empty values
  // - Concatenate UPPERCASE(key)=value followed by secret, no separators
  const keys = Object.keys(params).filter(k => k.toLowerCase() !== 'sha_sign');
  keys.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  let shaString = '';
  for (const key of keys) {
    const value = params[key];
    const isEmpty = value === undefined || value === '';
    if (isEmpty) continue;
    shaString += `${key.toUpperCase()}=${value}${secret}`;
  }

  const expected = crypto.createHash('sha512').update(shaString).digest('hex').toUpperCase();
  return expected === received;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const buf = await buffer(req);
    const raw = buf.toString('utf8');

    let payload: Record<string, string> = {};
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    if (contentType.includes('application/x-www-form-urlencoded')) {
      payload = Object.fromEntries(new URLSearchParams(raw)) as Record<string, string>;
    } else if (contentType.includes('application/json')) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = {};
      }
    } else {
      // Fallback: try parsing as URL-encoded
      payload = Object.fromEntries(new URLSearchParams(raw)) as Record<string, string>;
    }

    if (!verifyShaSign(payload)) {
      return res.status(401).json({ message: 'Ungültige Signatur' });
    }

    const email: string | undefined =
      payload['buyer_email'] || payload['customer_email'] || payload['email'] || payload['payer_email'] || payload['buyeremail'];

    if (!email) {
      return res.status(400).json({ message: 'E-Mail im Postback fehlt' });
    }

    // Try to find the restaurant by its contact/billing email
    const restaurant = await prisma.restaurant.findFirst({ where: { email } });

    if (!restaurant) {
      // If not found by email, we can also try by userId via a custom field
      const restaurantId = (payload['custom'] || payload['sub_id'] || payload['order_custom'] || undefined) as string | undefined;
      if (restaurantId && typeof restaurantId === 'string') {
        try {
          const byId = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
          if (byId) {
            await prisma.restaurant.update({
              where: { id: restaurantId },
              data: {
                isActive: true,
                isVisible: true,
                contractStatus: ContractStatus.ACTIVE,
              },
            });

            return res.status(200).json({ message: 'Restaurant aktiviert (ID)', restaurantId });
          }
        } catch (e) {
          // ignore and fall through
        }
      }

      return res.status(404).json({ message: 'Restaurant für E-Mail nicht gefunden' });
    }

    // Mark restaurant as active/visible and set contract active
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        isActive: true,
        isVisible: true,
        contractStatus: ContractStatus.ACTIVE,
      },
    });

    return res.status(200).json({ message: 'Restaurant aktiviert', restaurantId: restaurant.id });
  } catch (error) {
    console.error('Fehler im Digistore-Webhook:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  } finally {
    await prisma.$disconnect();
  }
}