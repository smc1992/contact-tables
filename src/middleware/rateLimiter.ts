import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';

// Rate limiter configuration
const WINDOW_SIZE_MS = 60 * 60 * 1000; // 1 hour window
const MAX_EMAILS_PER_WINDOW = 400; // Max emails per hour (reduziert auf 400)
const MAX_EMAILS_PER_USER_WINDOW = 100; // Max emails per user per hour
const BATCH_SIZE = 50; // Anzahl der E-Mails pro Batch
const BATCH_INTERVAL_MS = 5 * 60 * 1000; // 5 Minuten zwischen Batches

interface RateLimitResponse {
  ok: boolean;
  message: string;
  remainingLimit?: number;
  resetTime?: string;
  batchScheduled?: boolean;
  batchId?: string;
  estimatedSendTime?: string;
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
 * Erstellt einen neuen Batch für verzögerten E-Mail-Versand
 */
export async function createEmailBatch(
  campaignId: string,
  recipientCount: number
): Promise<{ batchId: string; scheduledTime: Date } | null> {
  try {
    const adminSupabase = createAdminClient();
    const now = new Date();
    
    // Finde den letzten geplanten Batch
    const { data: lastBatch } = await adminSupabase
      .from('email_batches')
      .select('scheduled_time')
      .order('scheduled_time', { ascending: false })
      .limit(1)
      .single();
    
    // Berechne die Zeit für den neuen Batch
    let scheduledTime: Date;
    if (lastBatch) {
      const lastScheduledTime = new Date(lastBatch.scheduled_time);
      scheduledTime = new Date(Math.max(
        now.getTime() + BATCH_INTERVAL_MS,
        lastScheduledTime.getTime() + BATCH_INTERVAL_MS
      ));
    } else {
      scheduledTime = new Date(now.getTime() + BATCH_INTERVAL_MS);
    }
    
    // Erstelle den neuen Batch
    const { data: batch, error } = await adminSupabase
      .from('email_batches')
      .insert({
        campaign_id: campaignId,
        scheduled_time: scheduledTime.toISOString(),
        status: 'PENDING',
        recipient_count: recipientCount,
        sent_count: 0,
        failed_count: 0
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating email batch:', error);
      return null;
    }
    
    return {
      batchId: batch.id,
      scheduledTime
    };
  } catch (error) {
    console.error('Error creating email batch:', error);
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
        const batchInfo = await createEmailBatch(req.body.campaignId, recipientCount);
        
        if (batchInfo) {
          res.status(202).json({
            ok: true,
            message: 'Email campaign scheduled for batch processing due to rate limits.',
            remainingLimit: MAX_EMAILS_PER_WINDOW - (globalCount || 0),
            resetTime: resetTime.toISOString(),
            batchScheduled: true,
            batchId: batchInfo.batchId,
            estimatedSendTime: batchInfo.scheduledTime.toISOString()
          });
          return false; // Nicht sofort senden, sondern in Batches
        }
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
