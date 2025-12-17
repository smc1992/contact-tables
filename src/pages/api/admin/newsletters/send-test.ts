import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { createAdminClient, createClient } from '@/utils/supabase/server';

interface SendTestResponse {
  ok: boolean;
  message: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SendTestResponse>) {
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

    const { id: newsletterId, to } = req.body as { id?: string; to?: string };
    if (!newsletterId || !to) {
      return res.status(400).json({ ok: false, message: 'Missing newsletter id or recipient email' });
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

    // Create transporter using DB-configured SMTP
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // SSL for 465
      auth: { user: smtpUser, pass: smtpPass },
    });

    // Send a single test email
    await transporter.sendMail({
      from: `Contact Tables <${fromAddress}>`,
      to,
      subject: `[TEST] ${newsletter.subject}`,
      html: newsletter.content,
    });

    return res.status(200).json({ ok: true, message: 'Test email sent' });
  } catch (error: any) {
    console.error('Newsletter test send error:', error);
    return res.status(200).json({ ok: false, message: error?.message || 'Send failed' });
  }
}
