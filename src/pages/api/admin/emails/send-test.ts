import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import nodemailer from 'nodemailer';
import { withAdminAuth } from '../../middleware/withAdminAuth';

interface Attachment {
  filename: string;
  content: string; // Base64 encoded content
  contentType: string;
}

interface SendTestRequest {
  subject: string;
  content: string;
  to: string;
  templateId?: string;
  attachments?: Attachment[];
}

interface SendResponse {
  ok: boolean;
  message: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<SendResponse>, userId: string) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    // Auth is already checked by withAdminAuth middleware
    const supabase = createClient({ req, res });
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;
    
    if (!currentUser) {
      return res.status(401).json({ ok: false, message: 'User not found' });
    }

    const { subject, content, to, templateId, attachments = [] } = req.body as SendTestRequest;
    
    if (!subject || !content || !to) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Missing required fields: subject, content, and recipient email' 
      });
    }

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
    });

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
        console.warn('Template not found, using provided content:', templateError);
      } else if (template) {
        templateContent = template.content;
        templateSubject = template.subject;
      }
    }
    
    // Replace placeholders in content
    let personalizedContent = templateContent;
    personalizedContent = personalizedContent.replace(/{name}/g, 'Test-Empfänger');

    // Process attachments if any
    const emailAttachments = attachments.map(attachment => ({
      filename: attachment.filename,
      content: Buffer.from(attachment.content, 'base64'),
      contentType: attachment.contentType
    }));
    
    // Add test label to subject
    const testSubject = `[TEST] ${templateSubject}`;
    
    // Send test email
    await transporter.sendMail({
      from: `Contact Tables <${fromAddress}>`,
      to,
      subject: testSubject,
      html: personalizedContent,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined
    });

    return res.status(200).json({ 
      ok: true, 
      message: 'Test email sent successfully' 
    });
  } catch (error) {
    console.error('Test email sending error:', error);
    return res.status(500).json({ 
      ok: false, 
      message: `Error sending test email: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
