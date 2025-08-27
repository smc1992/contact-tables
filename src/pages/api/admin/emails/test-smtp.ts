import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import nodemailer from 'nodemailer';

interface TestResponse {
  ok: boolean;
  message: string;
  config?: {
    host: string;
    port: number;
    secure: boolean;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TestResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    // Auth check: only admins may test SMTP
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

    const adminSupabase = createAdminClient();

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

    // Verify SMTP connection
    await transporter.verify();

    return res.status(200).json({ 
      ok: true, 
      message: 'SMTP connection successful', 
      config: {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465
      }
    });
  } catch (error) {
    console.error('SMTP test error:', error);
    return res.status(500).json({ 
      ok: false, 
      message: `SMTP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
