import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { createAdminClient, createClient } from '@/utils/supabase/server';

interface SendResponse {
  ok: boolean;
  message: string;
  totalRecipients?: number;
  sent?: number;
  failed?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SendResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    // Auth check: only admins may send
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

    const { id: newsletterId } = req.body as { id?: string };
    if (!newsletterId) {
      return res.status(400).json({ ok: false, message: 'Missing newsletter id' });
    }

    const adminSupabase = createAdminClient();

    // Load newsletter content
    const { data: newsletter, error: nlErr } = await adminSupabase
      .from('newsletters')
      .select('id, subject, content, status')
      .eq('id', newsletterId)
      .single();

    if (nlErr || !newsletter) {
      return res.status(404).json({ ok: false, message: 'Newsletter not found' });
    }

    // Load SMTP settings from system_settings (fall back to env)
    const { data: settings } = await adminSupabase
      .from('system_settings')
      .select('smtp_host, smtp_port, smtp_user, smtp_password, contact_email')
      .single();

    const smtpHost = settings?.smtp_host || process.env.EMAIL_SERVER_HOST;
    const smtpPort = Number(settings?.smtp_port || process.env.EMAIL_SERVER_PORT);
    const smtpUser = settings?.smtp_user || process.env.EMAIL_SERVER_USER;
    const smtpPass = settings?.smtp_password || process.env.EMAIL_SERVER_PASSWORD;
    const fromAddress = settings?.contact_email || process.env.EMAIL_FROM;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromAddress) {
      return res.status(500).json({ ok: false, message: 'SMTP configuration incomplete. Please set in admin settings.' });
    }

    // Mark as sending
    await adminSupabase
      .from('newsletters')
      .update({ status: 'sending', sent_at: new Date().toISOString() })
      .eq('id', newsletterId);

    // Create transporter using DB-configured SMTP
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // SSL for 465
      auth: { user: smtpUser, pass: smtpPass },
    });

    // Fetch all users to send to
    let allUsers: { email: string | null }[] = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data, error } = await adminSupabase.auth.admin.listUsers({ perPage, page });
      if (error) break;
      const users = data?.users || [];
      allUsers.push(...users.map(u => ({ email: u.email ?? null })));
      if (users.length < perPage) break;
      page += 1;
    }

    // Filter valid emails
    const recipients = allUsers.map(u => u.email).filter((e): e is string => !!e);

    if (recipients.length === 0) {
      await adminSupabase
        .from('newsletters')
        .update({ status: 'failed' })
        .eq('id', newsletterId);
      return res.status(200).json({ ok: false, message: 'No recipients found', totalRecipients: 0, sent: 0, failed: 0 });
    }

    let sent = 0;
    let failed = 0;

    // Send emails sequentially to avoid provider rate limits/timeouts
    for (const to of recipients) {
      try {
        await transporter.sendMail({
          from: `Contact Tables <${fromAddress}>`,
          to,
          subject: newsletter.subject,
          html: newsletter.content,
        });
        sent += 1;
      } catch (e) {
        failed += 1;
        // continue
      }
    }

    // Update newsletter stats
    await adminSupabase
      .from('newsletters')
      .update({ status: failed === 0 ? 'sent' : 'failed', recipient_count: recipients.length })
      .eq('id', newsletterId);

    return res.status(200).json({ ok: true, message: 'Send completed', totalRecipients: recipients.length, sent, failed });
  } catch (error) {
    console.error('Newsletter send error:', error);
    return res.status(500).json({ ok: false, message: 'Internal server error' });
  }
}
