import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

enum EmailBatchStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

interface ProcessBatchResponse {
  ok: boolean;
  message: string;
  batchId?: string;
  processed?: number;
  remaining?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ProcessBatchResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    // Allow internal/scheduled invocations via secret header
    const cronSecret = process.env.CRON_SECRET;
    const adminToken = process.env.ADMIN_API_TOKEN;
    const authHeader = (req.headers['authorization'] || req.headers['x-internal-secret'] || req.headers['x-cron-secret'] || '') as string;
    const provided = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : authHeader.trim();
    const adminHeader = (req.headers['x-admin-token'] || '') as string;
    const isInternal = Boolean(
      (cronSecret && provided && provided === cronSecret) ||
      (adminToken && adminHeader && adminHeader === adminToken)
    );

    if (!isInternal) {
      // Auth check: only admins may process batches
      const supabase = createClient({ req, res });
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;
      if (!currentUser) {
        return res.status(401).json({ ok: false, message: 'Unauthorized' });
      }
      const role = (currentUser.user_metadata as any)?.role;
      if (role !== 'admin' && role !== 'ADMIN') {
        return res.status(403).json({ ok: false, message: 'Forbidden' });
      }
    }

    const batchId = (req.body as any)?.batchId || (req.body as any)?.batch_id;
    if (!batchId) {
      return res.status(400).json({ ok: false, message: 'Missing required field: batchId' });
    }

    // Get the batch using raw SQL query since Prisma models might not be fully synced
    const batchResult = await prisma.$queryRaw`
      SELECT eb.*, ec.subject, ec.content 
      FROM email_batches eb
      JOIN email_campaigns ec ON eb.campaign_id = ec.id
      WHERE eb.id = ${batchId}::uuid
    `;
    
    const batch = Array.isArray(batchResult) && batchResult.length > 0 ? batchResult[0] : null;

    if (!batch) {
      return res.status(404).json({ ok: false, message: 'Batch not found' });
    }

    const normalizedStatus = String((batch as any).status || '').toUpperCase();
    if (normalizedStatus !== 'PENDING') {
      return res.status(400).json({ 
        ok: false, 
        message: `Batch is already ${String((batch as any).status || '').toLowerCase()}` 
      });
    }

    // Update batch status to processing
    await prisma.$executeRaw`
      UPDATE email_batches 
      SET status = 'processing' 
      WHERE id = ${batchId}::uuid
    `;

    const adminSupabase = createAdminClient();

    // Load SMTP settings from system_settings (fall back to env)
    const { data: settings } = await adminSupabase
      .from('system_settings')
      .select('smtp_host, smtp_port, smtp_user, smtp_password, contact_email, website_url')
      .single();

    const smtpHost = settings?.smtp_host || process.env.EMAIL_SERVER_HOST;
    const smtpPort = Number(settings?.smtp_port || process.env.EMAIL_SERVER_PORT);
    const smtpUser = settings?.smtp_user || process.env.EMAIL_SERVER_USER;
    const smtpPass = settings?.smtp_password || process.env.EMAIL_SERVER_PASSWORD;
    const fromAddress = settings?.contact_email || process.env.EMAIL_FROM;
    const websiteUrl = settings?.website_url || process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://contact-tables.com';

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromAddress) {
      await prisma.email_batches.update({
        where: { id: batchId },
        data: { status: 'failed' }
      });
      return res.status(500).json({ 
        ok: false, 
        message: 'SMTP configuration incomplete. Please set in admin settings.' 
      });
    }

    // Create transporter using DB-configured SMTP
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // SSL for 465
      auth: { user: smtpUser, pass: smtpPass },
      // Add rate limiting and retry options
      pool: true, // Use pooled connections
      maxConnections: 5, // Limit concurrent connections
      maxMessages: 100, // Limit messages per connection
      rateDelta: 1000, // Limit to 1 message per second
      rateLimit: 5, // Limit to 5 messages per second
    });

    // Determine max recipients to send in this invocation (default 50, capped at 200)
    const requestedMax = Number((req.body as any)?.maxToSend ?? 50);
    let maxToSend = Math.max(0, Math.min(Number.isFinite(requestedMax) ? requestedMax : 50, 200));

    // Enforce global hourly quota at the batch level as an extra safety net
    const windowStart = new Date(Date.now() - 60 * 60 * 1000);
    const { count: sentInWindow } = await adminSupabase
      .from('email_recipients')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', windowStart.toISOString());
    const remainingQuota = Math.max(0, 200 - (sentInWindow || 0));
    maxToSend = Math.min(maxToSend, remainingQuota);

    if (maxToSend <= 0) {
      // No quota left in this hour
      const { count: pendingCount } = await adminSupabase
        .from('email_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', batch.campaign_id)
        .eq('status', 'pending');
      await prisma.$executeRaw`
        UPDATE email_batches 
        SET status = 'PENDING' 
        WHERE id = ${batchId}::uuid
      `;
      return res.status(200).json({
        ok: true,
        message: 'Hourly quota exhausted, will continue next run',
        batchId,
        processed: 0,
        remaining: pendingCount || 0
      });
    }

    // Get recipients for this campaign that haven't been processed yet
    const { data: recipients } = await adminSupabase
      .from('email_recipients')
      .select('id, recipient_id, recipient_email, unsubscribe_token, status')
      .eq('campaign_id', batch.campaign_id)
      .eq('status', 'pending')
      .limit(maxToSend); // Process up to maxToSend recipients for this run

    if (!recipients || recipients.length === 0) {
      await prisma.email_batches.update({
        where: { id: batchId },
        data: { status: 'completed' }
      });
      return res.status(200).json({ 
        ok: true, 
        message: 'No pending recipients found for this batch',
        batchId,
        processed: 0,
        remaining: 0
      });
    }

    // Check if recipient has unsubscribed
    const recipientEmails = recipients.map(r => r.recipient_email);
    const { data: unsubscribed } = await adminSupabase
      .from('unsubscribed_emails')
      .select('email')
      .in('email', recipientEmails);
    
    const unsubscribedEmails = new Set((unsubscribed || []).map(u => u.email));
    
    // Track email sending results
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send emails sequentially to avoid provider rate limits/timeouts
    for (const recipient of recipients) {
      // Skip unsubscribed recipients
      if (unsubscribedEmails.has(recipient.recipient_email)) {
        console.log(`Skipping unsubscribed recipient: ${recipient.recipient_email}`);
        
        // Update recipient status
        await adminSupabase
          .from('email_recipients')
          .update({ status: 'skipped', error_message: 'Recipient has unsubscribed' })
          .eq('id', recipient.id);
          
        continue;
      }

      let retryCount = 0;
      let success = false;
      let lastError: any = null;
      const maxRetries = 3;
      
      // Get user details
      const { data: userData } = await adminSupabase
        .from('users')
        .select('name')
        .eq('id', recipient.recipient_id)
        .single();
      
      const recipientName = userData?.name || '';
      
      // Try sending with retries
      while (retryCount < maxRetries && !success) {
        try {
          // Ensure unsubscribe token exists (generate if missing)
          let unsubscribeToken = recipient.unsubscribe_token;
          if (!unsubscribeToken) {
            const token = crypto.randomBytes(32).toString('hex');
            await adminSupabase
              .from('unsubscribe_tokens')
              .insert({
                token,
                email: recipient.recipient_email,
                expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
              });
            unsubscribeToken = token;
            // Try to store it on the recipient row for reference
            await adminSupabase
              .from('email_recipients')
              .update({ unsubscribe_token: token })
              .eq('id', recipient.id);
          }

          // Replace placeholders in content
          let personalizedContent = batch.content;
          if (recipientName) {
            personalizedContent = personalizedContent.replace(/{name}/g, recipientName);
          } else {
            personalizedContent = personalizedContent.replace(/{name}/g, 'Kunde');
          }
          
          // Add unsubscribe link
          const unsubscribeUrl = `${websiteUrl}/unsubscribe?token=${unsubscribeToken}`;
          const unsubscribeHtml = `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              Wenn Sie keine weiteren E-Mails erhalten möchten, 
              <a href="${unsubscribeUrl}" style="color: #666;">klicken Sie hier zum Abbestellen</a>.
            </div>
          `;
          
          // Add tracking pixel
          const trackingUrl = `${websiteUrl}/api/tracking/open?rid=${recipient.id}&cid=${batch.campaign_id}`;
          const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;" />`;
          
          // Add tracking and unsubscribe to content
          personalizedContent = `${personalizedContent}${unsubscribeHtml}${trackingPixel}`;

          await transporter.sendMail({
            from: `Contact Tables <${fromAddress}>`,
            to: recipient.recipient_email,
            subject: batch.subject,
            html: personalizedContent,
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            }
          });

          // Log successful send
          await adminSupabase
            .from('email_recipients')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              retry_count: retryCount
            })
            .eq('id', recipient.id);

          sent += 1;
          success = true;
        } catch (e) {
          lastError = e;
          retryCount++;
          
          // Wait before retry (exponential backoff)
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          }
        }
      }
      
      // If all retries failed
      if (!success) {
        failed += 1;
        const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
        errors.push(`${recipient.recipient_email}: ${errorMessage}`);
        
        // Log failed send
        await adminSupabase
          .from('email_recipients')
          .update({
            status: 'failed',
            error_message: errorMessage,
            retry_count: retryCount
          })
          .eq('id', recipient.id);
      }
    }

    // Update batch status
    const newStatus = recipients.length === sent + failed ? 'COMPLETED' : 'PENDING';
    await prisma.$executeRaw`
      UPDATE email_batches 
      SET 
        sent_count = sent_count + ${sent},
        failed_count = failed_count + ${failed},
        status = ${newStatus}
      WHERE id = ${batchId}::uuid
    `;

    // Check if all recipients have been processed
    const { count: remainingCount } = await adminSupabase
      .from('email_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', batch.campaign_id)
      .eq('status', 'pending');

    // If all recipients processed, update campaign status
    if (remainingCount === 0) {
      const finalStatus = failed === 0 ? 'SENT' : (sent > 0 ? 'PARTIAL' : 'FAILED');
      await prisma.$executeRaw`
        UPDATE email_campaigns 
        SET 
          status = ${finalStatus},
          completed_at = ${new Date()}
        WHERE id = ${batch.campaign_id}::uuid
      `;
    }

    return res.status(200).json({ 
      ok: true, 
      message: 'Batch processing completed', 
      batchId,
      processed: sent + failed,
      remaining: remainingCount || 0
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    return res.status(500).json({ 
      ok: false, 
      message: `Batch processing error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
}
