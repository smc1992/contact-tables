import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { createAdminClient, createClient } from '@/utils/supabase/server';

interface TestResponse {
  ok: boolean;
  message: string;
  details?: {
    host: string;
    port: number;
    secure: boolean;
    from: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TestResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    const supabase = createClient({ req, res });
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const role = (user.user_metadata as any)?.role;
    if (role !== 'admin' && role !== 'ADMIN') {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }

    const adminSupabase = createAdminClient();
    const { data: settings } = await adminSupabase
      .from('system_settings')
      .select('smtp_host, smtp_port, smtp_user, smtp_password, contact_email')
      .single();

    const host = settings?.smtp_host || process.env.EMAIL_SERVER_HOST;
    const port = Number(settings?.smtp_port || process.env.EMAIL_SERVER_PORT);
    const userName = settings?.smtp_user || process.env.EMAIL_SERVER_USER;
    const pass = settings?.smtp_password || process.env.EMAIL_SERVER_PASSWORD;
    const from = settings?.contact_email || process.env.EMAIL_FROM;

    if (!host || !port || !userName || !pass || !from) {
      return res.status(500).json({ ok: false, message: 'SMTP configuration incomplete. Please fill out SMTP settings in admin panel or env.' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: userName, pass },
    });

    await transporter.verify();

    return res.status(200).json({
      ok: true,
      message: 'SMTP connection successful',
      details: { host, port, secure: port === 465, from },
    });
  } catch (err: any) {
    console.error('SMTP test error:', err);
    return res.status(200).json({ ok: false, message: err?.message || 'SMTP test failed' });
  }
}
