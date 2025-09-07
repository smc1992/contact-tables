import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Netlify Scheduled Function: runs every few minutes (configured in netlify.toml)
// It finds pending email batches whose scheduled_time is due and triggers
// the Next.js API route /api/admin/emails/process-batch for each one.

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const CRON_SECRET = process.env.CRON_SECRET as string;

// Der Basis-Host für den Aufruf der Next.js API.
// Netlify setzt URL in Prod. In Previews gibt es DEPLOY_PRIME_URL.
// Fallback auf NEXT_PUBLIC_WEBSITE_URL, wenn gesetzt.
const SITE_URL = (process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.NEXT_PUBLIC_WEBSITE_URL || '').replace(/\/$/, '');

export const handler: Handler = async () => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' })
      };
    }

    if (!CRON_SECRET) {
      // Wir arbeiten trotzdem weiter, aber Hinweis ausgeben
      console.warn('[process-email-batches] CRON_SECRET not set. Scheduled trigger will likely be rejected by API route.');
    }

    if (!SITE_URL) {
      console.warn('[process-email-batches] SITE_URL not resolved from env (URL/DEPLOY_PRIME_URL/NEXT_PUBLIC_WEBSITE_URL).');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // Finde fällige Batches: Status PENDING und scheduled_time <= now
    const nowIso = new Date().toISOString();
    const { data: batches, error } = await supabase
      .from('email_batches')
      .select('id, scheduled_time, status, recipient_count')
      .eq('status', 'PENDING')
      .lte('scheduled_time', nowIso)
      .order('scheduled_time', { ascending: true })
      .limit(5); // bis zu 5 Batches pro Lauf

    if (error) {
      console.error('[process-email-batches] Failed to query batches:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, message: `Failed to query batches: ${error.message}` })
      };
    }

    if (!batches || batches.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, message: 'No due batches found', processed: 0 })
      };
    }

    let processed = 0;
    const results: Array<{ batchId: string; status: number; ok: boolean; error?: string }> = [];

    for (const b of batches) {
      if (!SITE_URL) {
        results.push({ batchId: b.id as string, status: 0, ok: false, error: 'SITE_URL missing' });
        continue;
      }

      try {
        const resp = await fetch(`${SITE_URL}/api/admin/emails/process-batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CRON_SECRET || ''}`
          },
          body: JSON.stringify({ batchId: b.id })
        });
        const ok = resp.ok;
        results.push({ batchId: b.id as string, status: resp.status, ok });
        if (ok) processed += 1;
      } catch (e: any) {
        console.error('[process-email-batches] Failed to call process-batch for', b.id, e?.message || e);
        results.push({ batchId: b.id as string, status: 0, ok: false, error: e?.message || 'unknown error' });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: 'Trigger finished', processed, results })
    };
  } catch (e: any) {
    console.error('[process-email-batches] Unexpected error:', e?.message || e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, message: e?.message || 'Unexpected error' })
    };
  }
};

export default handler;
