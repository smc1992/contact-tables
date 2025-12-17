import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';

// Rate limiter configuration
const WINDOW_SIZE_MS = 60 * 60 * 1000; // 1 hour window
const MAX_EMAILS_PER_WINDOW = 200; // Max emails per hour (200 E-Mails pro Stunde)
const MAX_EMAILS_PER_USER_WINDOW = 200; // Max emails per user per hour (200 E-Mails pro Benutzer pro Stunde)
const BATCH_SIZE = 200; // Anzahl der E-Mails pro Batch (200 E-Mails pro Batch)
const BATCH_INTERVAL_MS = 60 * 60 * 1000; // 1 Stunde zwischen Batches (genau 1 Stunde)
const MAX_BATCH_COUNT = 10; // Maximale Anzahl von Batches pro Kampagne (für bis zu 2000 E-Mails)

interface RateLimitResponse {
  ok: boolean;
  message: string;
  remainingLimit?: number;
  resetTime?: string;
  batchScheduled?: boolean;
  batchId?: string;
  estimatedSendTime?: string;
  totalBatches?: number;
  estimatedCompletionTime?: string;
  batchSize?: number;
  batchInterval?: string;
}

interface EmailBatch {
  id: string;
  campaignId: string;
  scheduledTime: Date;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  recipientCount: number;
  sentCount: number;
  failedCount: number;
}

/**
 * Prüft, ob eine E-Mail-Kampagne sofort gesendet werden kann oder in die Warteschlange gestellt werden muss
 */
export async function checkEmailQuota(
  recipientCount: number
): Promise<{ canSendImmediately: boolean; remainingQuota: number; resetTime: Date }> {
  try {
    const adminSupabase = createAdminClient();
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_SIZE_MS);
    
    // Prüfe globales Rate-Limit
    const { count: globalCount, error: globalError } = await adminSupabase
      .from('email_recipients')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', windowStart.toISOString());
    
    if (globalError) {
      console.error('Error checking global rate limit:', globalError);
      return { canSendImmediately: true, remainingQuota: MAX_EMAILS_PER_WINDOW, resetTime: new Date(now.getTime() + WINDOW_SIZE_MS) };
    }
    
    const sentCount = globalCount || 0;
    const remainingQuota = MAX_EMAILS_PER_WINDOW - sentCount;
    const resetTime = new Date(windowStart.getTime() + WINDOW_SIZE_MS);
    
    return {
      canSendImmediately: remainingQuota >= recipientCount,
      remainingQuota,
      resetTime
    };
  } catch (error) {
    console.error('Error checking email quota:', error);
    return { 
      canSendImmediately: true, 
      remainingQuota: MAX_EMAILS_PER_WINDOW, 
      resetTime: new Date(Date.now() + WINDOW_SIZE_MS) 
    };
  }
}

/**
 * Erstellt mehrere Batches für verzögerten E-Mail-Versand
 */
export async function createEmailBatch(
  campaignId: string,
  recipientCount: number
): Promise<{ batchId: string; scheduledTime: Date; totalBatches: number; estimatedCompletionTime: Date } | null> {
  try {
    const adminSupabase = createAdminClient();
    const now = new Date();
    
    // Berechne die Anzahl der benötigten Batches
    const totalBatches = Math.ceil(recipientCount / BATCH_SIZE);
    console.log(`Erstelle ${totalBatches} Batches für ${recipientCount} Empfänger (${BATCH_SIZE} pro Batch)`);
    
    if (totalBatches > MAX_BATCH_COUNT) {
      console.warn(`Warnung: Die Anzahl der benötigten Batches (${totalBatches}) überschreitet das Maximum (${MAX_BATCH_COUNT})`);
    }
    
    // Finde den letzten geplanten Batch
    const { data: existingBatches, error: batchError } = await adminSupabase
      .from('email_batches')
      .select('scheduled_time, batch_number')
      .eq('campaign_id', campaignId)
      .order('batch_number', { ascending: false })
      .limit(1);
    
    // Bestimme die Startzeit für den ersten Batch
    let startTime: Date;
    let batchNumber = 1;
    
    if (batchError) {
      console.error('Fehler beim Abrufen bestehender Batches:', batchError);
      startTime = new Date(now.getTime() + BATCH_INTERVAL_MS);
    } else if (existingBatches && existingBatches.length > 0) {
      const lastBatch = existingBatches[0];
      const lastScheduledTime = new Date(lastBatch.scheduled_time);
      startTime = new Date(Math.max(
        now.getTime() + BATCH_INTERVAL_MS,
        lastScheduledTime.getTime() + BATCH_INTERVAL_MS
      ));
      batchNumber = (lastBatch.batch_number || 0) + 1;
    } else {
      startTime = new Date(now.getTime() + BATCH_INTERVAL_MS);
    }
    
    // Erstelle den ersten Batch
    const scheduledTime = startTime;
    const estimatedCompletionTime = new Date(startTime.getTime() + (totalBatches - 1) * BATCH_INTERVAL_MS);
    
    console.log(`Erstelle ersten Batch für ${campaignId}, geplant für ${scheduledTime.toISOString()}`);
    console.log(`Geschätzte Fertigstellung aller Batches: ${estimatedCompletionTime.toISOString()}`);
    
    // Erstelle den neuen Batch
    const { data: batch, error } = await adminSupabase
      .from('email_batches')
      .insert({
        campaign_id: campaignId,
        scheduled_time: scheduledTime.toISOString(),
        status: 'PENDING',
        recipient_count: Math.min(recipientCount, BATCH_SIZE),
        sent_count: 0,
        failed_count: 0,
        batch_number: batchNumber,
        total_batches: totalBatches,
        estimated_completion_time: estimatedCompletionTime.toISOString()
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Fehler beim Erstellen des E-Mail-Batches:', error);
      return null;
    }
    
    // Aktualisiere die Kampagne mit der Gesamtzahl der Batches
    await adminSupabase
      .from('email_campaigns')
      .update({
        total_batches: totalBatches,
        estimated_completion_time: estimatedCompletionTime.toISOString()
      })
      .eq('id', campaignId);
    
    return {
      batchId: batch.id,
      scheduledTime,
      totalBatches,
      estimatedCompletionTime
    };
  } catch (error) {
    console.error('Fehler beim Erstellen des E-Mail-Batches:', error);
    return null;
  }
}

/**
 * Email rate limiting middleware
 * Limits the number of emails that can be sent in a time window
 */
export async function emailRateLimiter(
  req: NextApiRequest,
  res: NextApiResponse<RateLimitResponse>,
  userId: string
): Promise<boolean> {
  try {
    const adminSupabase = createAdminClient();
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_SIZE_MS);
    
    // Check global rate limit
    const { count: globalCount, error: globalError } = await adminSupabase
      .from('email_recipients')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', windowStart.toISOString());
    
    if (globalError) {
      console.error('Error checking global rate limit:', globalError);
      return true; // Allow to proceed on error
    }
    
    // Anzahl der zu sendenden E-Mails aus dem Request-Body extrahieren
    const recipientCount = req.body?.recipients?.length || 0;
    
    if ((globalCount || 0) + recipientCount > MAX_EMAILS_PER_WINDOW) {
      const resetTime = new Date(windowStart.getTime() + WINDOW_SIZE_MS);
      
      // Wenn die Kampagne zu groß ist, biete die Möglichkeit, sie in Batches zu senden
      if (req.body?.allowBatching && req.body?.campaignId) {
        console.log(`Rate-Limit erreicht. Versuche Batch-Verarbeitung für Kampagne ${req.body.campaignId} mit ${recipientCount} Empfängern...`);
        
        try {
          const batchInfo = await createEmailBatch(req.body.campaignId, recipientCount);
          
          if (batchInfo) {
            console.log(`Batch erfolgreich erstellt: ${batchInfo.batchId}, geplant für ${batchInfo.scheduledTime.toISOString()}`);
            
            res.status(202).json({
              ok: true,
              message: `E-Mail-Kampagne wurde für die Batch-Verarbeitung geplant. Insgesamt ${batchInfo.totalBatches} Batches mit je ${BATCH_SIZE} E-Mails werden stündlich versendet.`,
              remainingLimit: MAX_EMAILS_PER_WINDOW - (globalCount || 0),
              resetTime: resetTime.toISOString(),
              batchScheduled: true,
              batchId: batchInfo.batchId,
              estimatedSendTime: batchInfo.scheduledTime.toISOString(),
              totalBatches: batchInfo.totalBatches,
              estimatedCompletionTime: batchInfo.estimatedCompletionTime.toISOString(),
              batchSize: BATCH_SIZE,
              batchInterval: 'stündlich'
            });
            return false; // Nicht sofort senden, sondern in Batches
          } else {
            console.error('Batch-Erstellung fehlgeschlagen, aber keine Exception wurde geworfen');
          }
        } catch (batchError) {
          console.error('Fehler bei der Batch-Erstellung:', batchError);
          // Wir geben hier keinen Fehler zurück, sondern lassen den Code weiterlaufen zum normalen Rate-Limit-Fehler
        }
      } else {
        console.log(`Rate-Limit erreicht, aber Batch-Verarbeitung nicht aktiviert oder keine Kampagnen-ID vorhanden. allowBatching=${req.body?.allowBatching}, campaignId=${req.body?.campaignId}`);
      }
      
      res.status(429).json({
        ok: false,
        message: 'Email rate limit exceeded. Please try again later or enable batch sending.',
        remainingLimit: MAX_EMAILS_PER_WINDOW - (globalCount || 0),
        resetTime: resetTime.toISOString()
      });
      return false;
    }
    
    // Check user-specific rate limit
    const { count: userCount, error: userError } = await adminSupabase
      .from('email_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('sent_by', userId)
      .gte('created_at', windowStart.toISOString());
    
    if (userError) {
      console.error('Error checking user rate limit:', userError);
      return true; // Allow to proceed on error
    }
    
    if ((userCount || 0) >= MAX_EMAILS_PER_USER_WINDOW) {
      const resetTime = new Date(windowStart.getTime() + WINDOW_SIZE_MS);
      res.status(429).json({
        ok: false,
        message: 'Your email sending limit has been reached. Please try again later.',
        remainingLimit: 0,
        resetTime: resetTime.toISOString()
      });
      return false;
    }
    
    // Rate limit not exceeded
    return true;
  } catch (error) {
    console.error('Rate limiter error:', error);
    return true; // Allow to proceed on error
  }
}
