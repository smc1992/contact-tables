import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { emailRateLimiter } from '@/middleware/rateLimiter';
import { SupabaseClient } from '@supabase/supabase-js';

interface Recipient {
  id: string;
  email: string;
  name?: string;
}

interface Attachment {
  filename: string;
  content: string; // Base64 encoded content
  encoding?: string;
  contentType?: string;
}

interface SendEmailRequest {
  subject: string;
  content: string;
  recipients: Array<{
    id: string;
    email: string;
    name?: string;
  }>;
  templateId?: string;
  maxRetries?: number;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
    contentType?: string;
  }>;
  allowBatching?: boolean;
  batchSize?: number;
  batchId?: string;
}

interface SendResponse {
  ok: boolean;
  message: string;
  batchId?: string;
  totalRecipients?: number;
  sent?: number;
  failed?: number;
  skipped?: number;
  duration?: string;
  sendRate?: string | number;
  total?: number;
  success?: number;
  failure?: number;
  processingTime?: number;
  campaignId?: string;
  batchScheduled?: boolean;
  estimatedSendTime?: string;
  remainingRecipients?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SendResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    // Auth check: only admins may send emails
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

    const { subject, content, recipients, templateId, maxRetries = 3, attachments = [], allowBatching = false, batchSize = 50, batchId } = req.body as SendEmailRequest;
    
    if (!subject || !content || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Missing required fields: subject, content, and recipients' 
      });
    }

    const adminSupabase = createAdminClient();
    
    // Create an email history entry first to get campaignId
    const { data: emailHistory, error: historyError } = await adminSupabase
      .from('email_campaigns')
      .insert({
        subject: subject,
        content: content,
        recipient_count: recipients.length,
        status: 'sending',
        sent_by: currentUser.id,
        template_id: templateId || null
      })
      .select('id')
      .single();

    if (historyError || !emailHistory) {
      console.error('Error creating email history:', historyError);
      return res.status(500).json({ 
        ok: false, 
        message: `Failed to create email campaign: ${historyError?.message || 'Unknown error'}` 
      });
    }
    
    // Add campaignId to request body for rate limiter
    req.body.campaignId = emailHistory.id;
    req.body.allowBatching = allowBatching;
    
    // Apply rate limiting
    const rateLimitPassed = await emailRateLimiter(req, res, currentUser.id);
    if (!rateLimitPassed) {
      // If response is 202, it means the campaign was scheduled for batch processing
      if (res.statusCode === 202) {
        // Update campaign status to scheduled
        await adminSupabase
          .from('email_campaigns')
          .update({ status: 'scheduled' })
          .eq('id', emailHistory.id);
      }
      // Response already sent by the rate limiter
      return;
    }

    // Load SMTP settings from system_settings (fall back to env)
    const { data: settings } = await adminSupabase
      .from('system_settings')
      .select('smtp_host, smtp_port, smtp_user, smtp_password, contact_email, website_url')
      .single();
      
    // Get template if templateId is provided
    let templateContent = content;
    let templateSubject = subject;
    
    if (templateId) {
      const { data: template, error: templateError } = await adminSupabase
        .from('email_templates')
        .select('subject, content')
        .eq('id', templateId)
        .single();
        
      if (templateError) {
        console.error('Error fetching template:', templateError);
      } else if (template) {
        templateContent = template.content;
        templateSubject = template.subject;
      }
    }

    const smtpHost = settings?.smtp_host || process.env.EMAIL_SERVER_HOST;
    const smtpPort = Number(settings?.smtp_port || process.env.EMAIL_SERVER_PORT);
    const smtpUser = settings?.smtp_user || process.env.EMAIL_SERVER_USER;
    const smtpPass = settings?.smtp_password || process.env.EMAIL_SERVER_PASSWORD;
    const fromAddress = settings?.contact_email || process.env.EMAIL_FROM;
    const websiteUrl = settings?.website_url || process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://contact-tables.com';

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromAddress) {
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
      rateLimit: 5, // Limit to 5 messages per rateDelta
    });

    // Track email sending results
    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    // Log campaign start
    console.log(`[Email Campaign ${emailHistory.id}] Starting email campaign: "${subject}" to ${recipients.length} recipients`);
    const startTime = Date.now();

    // Update email campaign with template content if needed
    if (templateId) {
      await adminSupabase
        .from('email_campaigns')
        .update({
          subject: templateSubject,
          content: templateContent
        })
        .eq('id', emailHistory.id);
    }

    // Check if recipient has unsubscribed
    const recipientEmails = recipients.map(r => r.email);
    const { data: unsubscribed } = await adminSupabase
      .from('unsubscribed_emails')
      .select('email')
      .in('email', recipientEmails);
    
    const unsubscribedEmails = new Set((unsubscribed || []).map(u => u.email));
    
    // Batch-Verarbeitung vorbereiten
    let currentBatch: { data: { id: string } } | null = null;
    let recipientsToProcess: Array<{id: string; email: string; name?: string}> = [];
    
    if (batchId) {
      // Wenn ein Batch-ID vorhanden ist, hole die Empfänger für diesen Batch
      const { data, error } = await adminSupabase
        .from('email_batches')
        .select('id, recipient_count')
        .eq('id', batchId)
        .single();
      
      if (error || !data) {
        return res.status(404).json({ ok: false, message: 'Batch not found' });
      }
      
      currentBatch = { data };
      
      // Hole die Empfänger für diesen Batch
      const { data: batchRecipients } = await adminSupabase
        .from('email_recipients')
        .select('recipient_id, recipient_email')
        .eq('batch_id', batchId);
      
      if (batchRecipients && batchRecipients.length > 0) {
        recipientsToProcess = batchRecipients.map((r: {recipient_id: string; recipient_email: string}) => ({ 
          id: r.recipient_id, 
          email: r.recipient_email, 
          name: '' 
        }));
      }
    } else {
      // Wenn kein Batch-ID, erstelle einen neuen Batch und weise Empfänger zu
      const pendingRecipients = recipients.slice(0, batchSize);
      
      if (pendingRecipients.length === 0) {
        return res.status(200).json({ ok: true, message: 'No pending recipients found' });
      }
      
      // Erstelle einen neuen Batch
      const { data, error } = await adminSupabase
        .from('email_batches')
        .insert({
          campaign_id: emailHistory.id,
          status: 'processing',
          recipient_count: pendingRecipients.length,
        })
        .select('id')
        .single();
      
      if (error || !data) {
        return res.status(500).json({ ok: false, message: 'Failed to create batch' });
      }
      
      currentBatch = { data };
      
      // Weise Empfänger diesem Batch zu
      await Promise.all(pendingRecipients.map(recipient => {
        return adminSupabase
          .from('email_recipients')
          .insert({
            campaign_id: emailHistory.id,
            batch_id: data.id,
            recipient_id: recipient.id,
            recipient_email: recipient.email,
            status: 'pending',
          });
      }));
      
      recipientsToProcess = pendingRecipients;
    }

    try {
      // Process each recipient
      for (const recipient of recipientsToProcess) {
        // Skip unsubscribed recipients
        if (unsubscribedEmails.has(recipient.email)) {
          console.log(`[Email Campaign ${emailHistory.id}] Skipping unsubscribed recipient: ${recipient.email}`);
          skipped++;
          
          // Update recipient status to skipped
          await adminSupabase
            .from('email_recipients')
            .update({ status: 'skipped', status_message: 'Unsubscribed' })
            .eq('batch_id', currentBatch.data.id)
            .eq('recipient_id', recipient.id);
            
          continue;
        }
        
        // Generate unsubscribe token
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');
        await adminSupabase
          .from('unsubscribe_tokens')
          .insert({
            token: unsubscribeToken,
            email: recipient.email,
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(), // 1 year
          });
        
        // Replace template variables
        let personalizedContent = templateContent
          .replace(/\{\{name\}\}/g, recipient.name || '')
          .replace(/\{\{email\}\}/g, recipient.email)
          .replace(/\{\{unsubscribe_url\}\}/g, `${websiteUrl}/unsubscribe?token=${unsubscribeToken}`);
        
        // Add tracking pixel if HTML content
        if (personalizedContent.includes('</body>')) {
          const trackingPixel = `<img src="${websiteUrl}/api/tracking/email?campaignId=${emailHistory.id}&recipientId=${recipient.id}" width="1" height="1" alt="" style="display:none;" />\n</body>`;
          personalizedContent = personalizedContent.replace('</body>', trackingPixel);
        }
        
        // Prepare email
        const mailOptions = {
          from: fromAddress,
          to: recipient.email,
          subject: templateSubject,
          html: personalizedContent,
          attachments: attachments.map(attachment => ({
            filename: attachment.filename,
            content: Buffer.from(attachment.content, 'base64'),
            encoding: attachment.encoding || 'base64',
            contentType: attachment.contentType
          })),
        };
        
        // Update recipient status to sending
        await adminSupabase
          .from('email_recipients')
          .update({ status: 'sending' })
          .eq('batch_id', currentBatch.data.id)
          .eq('recipient_id', recipient.id);
        
        // Send email with retry logic
        let success = false;
        let lastError = null;
        let retryCount = 0;
        
        while (!success && retryCount <= maxRetries) {
          try {
            await transporter.sendMail(mailOptions);
            success = true;
            sent++;
            
            // Update recipient status to sent
            await adminSupabase
              .from('email_recipients')
              .update({ 
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('batch_id', currentBatch.data.id)
              .eq('recipient_id', recipient.id);
              
            console.log(`[Email Campaign ${emailHistory.id}] Email sent to ${recipient.email}`);
          } catch (error: any) {
            lastError = error;
            retryCount++;
            
            console.error(`[Email Campaign ${emailHistory.id}] Failed to send email to ${recipient.email} (attempt ${retryCount}/${maxRetries}):`, error.message);
            
            // Exponential backoff
            if (retryCount <= maxRetries) {
              const backoffTime = Math.pow(2, retryCount) * 1000; // 2^n seconds
              console.log(`[Email Campaign ${emailHistory.id}] Retrying in ${backoffTime/1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
          }
        }
        
        if (!success) {
          failed++;
          errors.push(`Failed to send to ${recipient.email}: ${lastError?.message || 'Unknown error'}`);
          
          // Update recipient status to failed
          await adminSupabase
            .from('email_recipients')
            .update({ 
              status: 'failed',
              status_message: lastError?.message || 'Unknown error'
            })
            .eq('batch_id', currentBatch.data.id)
            .eq('recipient_id', recipient.id);
        }
      }
      
      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000; // in seconds
      const sendRate = sent > 0 ? (sent / processingTime).toFixed(2) : 0; // emails per second
      
      // Update batch status
      await adminSupabase
        .from('email_batches')
        .update({
          status: 'completed',
          sent_count: sent,
          failed_count: failed,
          skipped_count: skipped,
          completed_at: new Date().toISOString(),
          processing_time: processingTime,
          send_rate: sendRate
        })
        .eq('id', currentBatch.data.id);
      
      // Check if all batches are completed
      const { data: batchesData } = await adminSupabase
        .from('email_batches')
        .select('status')
        .eq('campaign_id', emailHistory.id);
      
      const allBatchesCompleted = batchesData?.every(batch => batch.status === 'completed');
      
      // If all batches are completed, update campaign status
      if (allBatchesCompleted) {
        // Get total counts from all batches
        const { data: batchStats } = await adminSupabase
          .from('email_batches')
          .select('sent_count, failed_count, skipped_count')
          .eq('campaign_id', emailHistory.id);
        
        const totalSent = batchStats?.reduce((sum, batch) => sum + (batch.sent_count || 0), 0) || 0;
        const totalFailed = batchStats?.reduce((sum, batch) => sum + (batch.failed_count || 0), 0) || 0;
        const totalSkipped = batchStats?.reduce((sum, batch) => sum + (batch.skipped_count || 0), 0) || 0;
        
        await adminSupabase
          .from('email_campaigns')
          .update({
            status: 'completed',
            sent_count: totalSent,
            failed_count: totalFailed,
            skipped_count: totalSkipped,
            completed_at: new Date().toISOString()
          })
          .eq('id', emailHistory.id);
      }
      
      // Check if there are more recipients to process
      const remainingRecipients = recipients.length - (sent + failed + skipped);
      
      // Return response
      return res.status(200).json({
        ok: true,
        message: `Email batch processed: ${sent} sent, ${failed} failed, ${skipped} skipped`,
        batchId: currentBatch.data.id,
        campaignId: emailHistory.id,
        totalRecipients: recipientsToProcess.length,
        sent,
        failed,
        skipped,
        duration: `${processingTime.toFixed(2)}s`,
        sendRate,
        remainingRecipients
      });
    } catch (error: any) {
      console.error('Error processing recipients:', error);
      
      // Update batch status to failed
      if (currentBatch?.data?.id) {
        await adminSupabase
          .from('email_batches')
          .update({
            status: 'failed',
            status_message: error.message || 'Unknown error'
          })
          .eq('id', currentBatch.data.id);
      }
      
      throw error; // Re-throw to be caught by outer try-catch
    }
  } catch (error: any) {
    console.error('Error sending emails:', error);
    
    // Update campaign status to failed if an error occurred
    if (req.body.campaignId) {
      const adminSupabase = createAdminClient();
      await adminSupabase
        .from('email_campaigns')
        .update({
          status: 'failed',
          status_message: error.message || 'Unknown error'
        })
        .eq('id', req.body.campaignId);
    }
    
    return res.status(500).json({
      ok: false,
      message: `Error sending emails: ${error.message || 'Unknown error'}`
    });
  }
}
