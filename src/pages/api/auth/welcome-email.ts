import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';

interface ApiResponse {
  ok: boolean;
  message: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  // Diese Route sollte nur mit POST-Anfragen aufgerufen werden
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    const { userId, email, name } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ ok: false, message: 'Missing required fields: userId, email' });
    }

    const adminSupabase = createAdminClient();

    // Überprüfen, ob der Benutzer die Rolle "customer" hat
    const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(500).json({ ok: false, message: `Error fetching user: ${userError.message}` });
    }

    if (!userData || !userData.user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    const userRole = userData.user.user_metadata?.role;
    
    // Nur für Benutzer mit der Rolle "customer" fortfahren
    if (userRole !== 'CUSTOMER') {
      return res.status(200).json({ ok: true, message: 'User is not a customer, no welcome email sent' });
    }

    // Willkommens-E-Mail-Vorlage abrufen
    const { data: templates, error: templateError } = await adminSupabase
      .from('email_templates')
      .select('*')
      .eq('name', 'Willkommen bei Contact Tables')
      .single();

    if (templateError) {
      console.error('Error fetching welcome email template:', templateError);
      return res.status(500).json({ ok: false, message: `Error fetching welcome email template: ${templateError.message}` });
    }

    if (!templates) {
      return res.status(404).json({ ok: false, message: 'Welcome email template not found' });
    }

    // SMTP-Einstellungen abrufen
    const { data: settings, error: settingsError } = await adminSupabase
      .from('system_settings')
      .select('smtp_host, smtp_port, smtp_user, smtp_password, contact_email, email_signature')
      .single();
      
    if (settingsError) {
      console.error('Error fetching SMTP settings:', settingsError);
      return res.status(500).json({ ok: false, message: `Error fetching SMTP settings: ${settingsError.message}` });
    }

    // E-Mail-Kampagne erstellen
    const { data: campaign, error: campaignError } = await adminSupabase
      .from('email_campaigns')
      .insert({
        subject: templates.subject,
        content: templates.content,
        status: 'processing',
        recipient_count: 1,
        sent_by: userId,
        template_id: templates.id
      })
      .select('id')
      .single();

    if (campaignError) {
      console.error('Error creating email campaign:', campaignError);
      return res.status(500).json({ ok: false, message: `Error creating email campaign: ${campaignError.message}` });
    }

    // E-Mail-Empfänger hinzufügen
    await adminSupabase
      .from('email_recipients')
      .insert({
        campaign_id: campaign.id,
        recipient_id: userId,
        recipient_email: email,
        status: 'pending'
      });

    // E-Mail senden
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/emails/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`
      },
      body: JSON.stringify({
        recipients: [{ id: userId, email, name: name || '' }],
        subject: templates.subject,
        content: templates.content,
        templateId: templates.id
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send email: ${errorData.message}`);
    }

    return res.status(200).json({ ok: true, message: 'Welcome email sent successfully' });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return res.status(500).json({ 
      ok: false, 
      message: `Error sending welcome email: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
