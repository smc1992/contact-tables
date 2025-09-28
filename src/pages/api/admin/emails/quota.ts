import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';
import { withAdminAuth } from './withAdminAuth';

// Konfiguration analog zu rateLimiter.ts
const WINDOW_SIZE_MS = 60 * 60 * 1000; // 1 Stunde
const MAX_EMAILS_PER_WINDOW = 200; // 200 E-Mails pro Stunde
const BATCH_SIZE = 200; // 200 E-Mails pro Batch
const BATCH_INTERVAL_MS = 60 * 60 * 1000; // 1 Stunde zwischen Batches

type QuotaResponse = {
  ok: boolean;
  remaining: number;
  used: number;
  maxPerHour: number;
  resetTime: string;
  windowSizeMs: number;
  batchSize: number;
  batchIntervalMs: number;
};

async function handler(req: NextApiRequest, res: NextApiResponse<QuotaResponse>, userId: string) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      remaining: 0,
      used: 0,
      maxPerHour: MAX_EMAILS_PER_WINDOW,
      resetTime: new Date(Date.now()).toISOString(),
      windowSizeMs: WINDOW_SIZE_MS,
      batchSize: BATCH_SIZE,
      batchIntervalMs: BATCH_INTERVAL_MS,
    });
  }

  try {
    const adminSupabase = createAdminClient();
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_SIZE_MS);

    const { count: sentCount, error } = await adminSupabase
      .from('email_recipients')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', windowStart.toISOString());

    if (error) {
      console.error('Quota API: Fehler beim Abrufen der gesendeten E-Mails im Fenster:', error);
    }

    const used = sentCount || 0;
    const remaining = Math.max(0, MAX_EMAILS_PER_WINDOW - used);
    // Reset-Zeit als Ende des aktuellen rollierenden Fensters (hier näherungsweise: jetzt)
    const resetTime = new Date(windowStart.getTime() + WINDOW_SIZE_MS).toISOString();

    return res.status(200).json({
      ok: true,
      remaining,
      used,
      maxPerHour: MAX_EMAILS_PER_WINDOW,
      resetTime,
      windowSizeMs: WINDOW_SIZE_MS,
      batchSize: BATCH_SIZE,
      batchIntervalMs: BATCH_INTERVAL_MS,
    });
  } catch (err) {
    console.error('Quota API: Unerwarteter Fehler:', err);
    return res.status(500).json({
      ok: false,
      remaining: 0,
      used: 0,
      maxPerHour: MAX_EMAILS_PER_WINDOW,
      resetTime: new Date(Date.now() + WINDOW_SIZE_MS).toISOString(),
      windowSizeMs: WINDOW_SIZE_MS,
      batchSize: BATCH_SIZE,
      batchIntervalMs: BATCH_INTERVAL_MS,
    });
  }
}

export default withAdminAuth(handler);