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

// Helper: Restaurant- und Vertragsstatus aktualisieren
async function setStatus(
  restaurantId: string,
  status: ContractStatus,
  opts?: { isActive?: boolean; isVisible?: boolean; cancellationDate?: Date }
) {
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      contractStatus: status,
      isActive: opts?.isActive ?? undefined,
      isVisible: opts?.isVisible ?? undefined,
    },
  });
  try {
    const existing = await prisma.contract.findUnique({ where: { restaurantId } });
    if (existing) {
      await prisma.contract.update({
        where: { restaurantId },
        data: {
          status,
          cancellationDate: opts?.cancellationDate ?? undefined,
        },
      });
    }
  } catch (e) {
    // ignore contract update errors
  }
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

    // Event & product filtering
    const rawEvent = (payload['event'] || payload['function_call'] || payload['event_label'] || '').toString().toLowerCase();
    const event = rawEvent.replace(/\s+/g, '_'); // normalize labels like "payment" vs "on_payment"
    const productIdStr = (payload['product_id'] || payload['productid'] || '').toString();
    const productId = Number(productIdStr);

    const ALLOWED_PRODUCTS = new Set([640621, 640542]); // yearly, monthly
    if (!ALLOWED_PRODUCTS.has(productId)) {
      // Reply 200 to avoid retries, but ignore unknown products
      return res.status(200).json({ message: 'Produkt ignoriert', event: rawEvent, productId });
    }

    // Identify restaurant by custom id first, then fallback to email
    const restaurantIdParam = (payload['custom'] || payload['sub_id'] || payload['order_custom'] || undefined) as string | undefined;
    let restaurant = null as Awaited<ReturnType<typeof prisma.restaurant.findUnique>> | null;

    if (restaurantIdParam && typeof restaurantIdParam === 'string') {
      try {
        restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantIdParam } });
      } catch (e) {
        // ignore; will fallback to email
      }
    }

    if (!restaurant) {
      const email: string | undefined =
        payload['buyer_email'] || payload['customer_email'] || payload['email'] || payload['payer_email'] || payload['buyeremail'];

      if (!email) {
        return res.status(400).json({ message: 'Identifikation fehlt (custom oder E-Mail)' });
      }

      restaurant = await prisma.restaurant.findFirst({ where: { email } });

      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant nicht gefunden', identifier: email });
      }
    }


    // Map Digistore events to status changes
    const isPayment = event === 'on_payment' || event === 'payment';
    const isRefund = event === 'on_refund' || event === 'refund';
    const isChargeback = event === 'on_chargeback' || event === 'chargeback' || event === 'payment_disputed';
    const isSubscriptionCanceled = event === 'on_subscription_canceled' || event === 'subscription_canceled' || event === 'subscription_cancelled';
    const isPaymentMissed = event === 'on_payment_missed' || event === 'payment_missed' || event === 'rebill_failed';
    const isConnectionTest = event === 'connection_test';

    if (isConnectionTest) {
      // Health-check from Digistore, acknowledge
      return res.status(200).json({ message: 'Verbindungstest bestätigt' });
    }

    if (isPayment) {
      await setStatus(restaurant.id, ContractStatus.ACTIVE, { isActive: true, isVisible: true });
      return res.status(200).json({ message: 'Restaurant aktiviert', restaurantId: restaurant.id, productId });
    }

    if (isRefund || isSubscriptionCanceled) {
      await setStatus(restaurant.id, ContractStatus.CANCELLED, { isActive: false, isVisible: false, cancellationDate: new Date() });
      return res.status(200).json({ message: 'Abo storniert/erstattet – Restaurant deaktiviert', restaurantId: restaurant.id, productId });
    }

    if (isChargeback) {
      await setStatus(restaurant.id, ContractStatus.REJECTED, { isActive: false, isVisible: false, cancellationDate: new Date() });
      return res.status(200).json({ message: 'Chargeback – Restaurant deaktiviert', restaurantId: restaurant.id, productId });
    }

    if (isPaymentMissed) {
      await setStatus(restaurant.id, ContractStatus.CANCELLED, { isActive: false, isVisible: false, cancellationDate: new Date() });
      return res.status(200).json({ message: 'Zahlung verpasst – Restaurant deaktiviert', restaurantId: restaurant.id, productId });
    }

    // Unknown or unsupported event – acknowledge to avoid retries
    return res.status(200).json({ message: 'Event ignoriert', event: rawEvent, productId, restaurantId: restaurant.id });
  } catch (error) {
    console.error('Fehler im Digistore-Webhook:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  } finally {
    await prisma.$disconnect();
  }
}