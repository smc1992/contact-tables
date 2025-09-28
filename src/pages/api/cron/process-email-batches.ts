import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

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
    const now = new Date();
    const errors: string[] = [];
    let processed = 0;
    let scheduled = 0;

    // Global Quota: max 200 emails per 1h window (IONOS limit)
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000);
    const { count: sentInWindow } = await adminSupabase
      .from('email_recipients')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', windowStart.toISOString());
    let remainingQuota = Math.max(0, 200 - (sentInWindow || 0));

    if (remainingQuota <= 0) {
      return res.status(200).json({
        ok: true,
        message: 'Stundenlimit erreicht (200). Warten bis Quotenfenster zurückgesetzt.',
        processed: 0,
        scheduled: 0
      });
    }

    // Finde alle fälligen Batches (scheduled_time <= jetzt und status = PENDING)
    const { data: pendingBatches, error: batchError } = await adminSupabase
      .from('email_batches')
      .select('id, campaign_id')
      .eq('status', 'PENDING')
      .lte('scheduled_time', now.toISOString())
      .order('scheduled_time', { ascending: true });

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
        processed: 0,
        scheduled: 0
      });
    }

    console.log(`${pendingBatches.length} fällige Batches gefunden`);

    // Verarbeite jeden Batch
    for (const batch of pendingBatches) {
      if (remainingQuota <= 0) break;

      try {
        // Rufe den Batch-Prozessor auf, begrenze pro Lauf die Anzahl über maxToSend
        const maxForThisBatch = Math.min(remainingQuota, 50); // Standard-Chunks von 50
        const response = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}/api/admin/emails/process-batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cronSecret}`
          },
          body: JSON.stringify({ batchId: batch.id, maxToSend: maxForThisBatch })
        });

        const result = await response.json();

        if (response.ok) {
          const processedCount = Number(result?.processed ?? 0);
          processed += processedCount;
          remainingQuota -= processedCount;
          console.log(`Batch ${batch.id} verarbeitet: ${processedCount} gesendet, verbleibende Quote: ${remainingQuota}`);
        } else {
          errors.push(`Batch ${batch.id}: ${result.message}`);
          console.error(`Fehler beim Verarbeiten von Batch ${batch.id}:`, result.message);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
        errors.push(`Batch ${batch.id}: ${errorMessage}`);
        console.error(`Fehler beim Verarbeiten von Batch ${batch.id}:`, error);
      }
    }

    // Plane die nächsten Batches
    const { data: nextBatches, error: nextError } = await adminSupabase
      .from('email_batches')
      .select('id, campaign_id, batch_number, total_batches')
      .eq('status', 'COMPLETED')
      .lt('batch_number', 100) // Sicherheitsgrenze
      .order('completed_at', { ascending: false })
      .limit(10);

    if (!nextError && nextBatches && nextBatches.length > 0) {
      for (const batch of nextBatches) {
        // Prüfe, ob es noch weitere Batches für diese Kampagne geben sollte
        if (batch.batch_number < batch.total_batches) {
          try {
            // Prüfe, ob bereits ein nächster Batch existiert
            const { count: existingCount } = await adminSupabase
              .from('email_batches')
              .select('id', { count: 'exact', head: true })
              .eq('campaign_id', batch.campaign_id)
              .eq('batch_number', batch.batch_number + 1);

            if (!existingCount) {
              // Erstelle den nächsten Batch
              const nextScheduledTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 Stunde später
              
              // Hole die Empfänger für den nächsten Batch
              const { data: pendingRecipients } = await adminSupabase
                .from('email_recipients')
                .select('id')
                .eq('campaign_id', batch.campaign_id)
                .eq('status', 'pending')
                .limit(200);
              
              if (pendingRecipients && pendingRecipients.length > 0) {
                const { data: newBatch, error: createError } = await adminSupabase
                  .from('email_batches')
                  .insert({
                    campaign_id: batch.campaign_id,
                    status: 'PENDING',
                    scheduled_time: nextScheduledTime.toISOString(),
                    batch_number: batch.batch_number + 1,
                    total_batches: batch.total_batches,
                    recipient_count: pendingRecipients.length,
                    sent_count: 0,
                    failed_count: 0
                  })
                  .select('id')
                  .single();

                if (!createError && newBatch) {
                  scheduled++;
                  console.log(`Nächster Batch für Kampagne ${batch.campaign_id} geplant: ${newBatch.id}`);
                  
                  // Aktualisiere die Empfänger mit der neuen Batch-ID
                  await adminSupabase
                    .from('email_recipients')
                    .update({ batch_id: newBatch.id })
                    .eq('campaign_id', batch.campaign_id)
                    .eq('status', 'pending')
                    .limit(200);
                }
              }
            }
          } catch (error) {
            console.error(`Fehler beim Planen des nächsten Batches für Kampagne ${batch.campaign_id}:`, error);
          }
        }
      }
    }

    return res.status(200).json({
      ok: true,
      message: `${processed} Batches verarbeitet, ${scheduled} neue Batches geplant`,
      processed,
      scheduled,
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
