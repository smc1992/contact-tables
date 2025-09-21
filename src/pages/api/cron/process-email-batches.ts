import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';

interface CronResponse {
  ok: boolean;
  message: string;
  processed?: number;
  scheduled?: number;
  errors?: string[];
}

/**
 * Cron-Job zum Verarbeiten von E-Mail-Batches
 * Dieser Endpunkt sollte regelmäßig (z.B. alle 5 Minuten) aufgerufen werden
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<CronResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  // Verify cron secret to prevent unauthorized access
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = (req.headers['authorization'] || req.headers['x-cron-secret'] || '') as string;
  const provided = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : authHeader.trim();

  if (!cronSecret || !provided || provided !== cronSecret) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  try {
    const adminSupabase = createAdminClient();
    const errors: string[] = [];
    let processed = 0;

    // Finde alle PENDING Batches (vereinfacht - keine scheduled_time Prüfung)
    const { data: pendingBatches, error: batchError } = await adminSupabase
      .from('email_batches')
      .select('id, campaign_id')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true })
      .limit(10); // Verarbeite maximal 10 Batches pro Lauf

    if (batchError) {
      console.error('Fehler beim Abrufen der fälligen Batches:', batchError);
      return res.status(500).json({
        ok: false,
        message: `Fehler beim Abrufen der fälligen Batches: ${batchError.message}`
      });
    }

    if (!pendingBatches || pendingBatches.length === 0) {
      return res.status(200).json({
        ok: true,
        message: 'Keine fälligen Batches gefunden',
        processed: 0
      });
    }

    console.log(`${pendingBatches.length} fällige Batches gefunden`);

    // Verarbeite jeden Batch
    for (const batch of pendingBatches) {
      try {
        // Rufe den Batch-Processor auf
        const response = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}/api/admin/emails/process-batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cronSecret}`
          },
          body: JSON.stringify({ batchId: batch.id })
        });

        const result = await response.json();

        if (response.ok && result.ok) {
          processed++;
          console.log(`Batch ${batch.id} erfolgreich verarbeitet`);
        } else {
          errors.push(`Batch ${batch.id}: ${result.message || 'Unbekannter Fehler'}`);
          console.error(`Fehler beim Verarbeiten von Batch ${batch.id}:`, result);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
        errors.push(`Batch ${batch.id}: ${errorMessage}`);
        console.error(`Fehler beim Verarbeiten von Batch ${batch.id}:`, error);
      }
    }

    return res.status(200).json({
      ok: true,
      message: `${processed} Batches verarbeitet`,
      processed,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Fehler beim Verarbeiten der E-Mail-Batches:', error);
    return res.status(500).json({
      ok: false,
      message: `Fehler beim Verarbeiten der E-Mail-Batches: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    });
  }
}
