// Supabase Edge Function für automatische Willkommens-E-Mails
// @ts-ignore - Deno-spezifische Importe
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// @ts-ignore - Deno-spezifische Importe
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: {
    id: string
    email?: string
    role?: string
    [key: string]: any
  }
  schema: string
  old_record?: any
}

serve(async (req: Request) => {
  try {
    // Nur POST-Anfragen akzeptieren
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Webhook-Payload parsen
    const payload: WebhookPayload = await req.json()
    
    // Nur auf neue Benutzer reagieren
    if (payload.type !== 'INSERT' || payload.table !== 'profiles') {
      return new Response(JSON.stringify({ message: 'Event ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Supabase-Client erstellen
    // @ts-ignore - Deno-spezifische Umgebungsvariablen
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Benutzerinformationen abrufen
    const userId = payload.record.id
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !userData?.user) {
      console.error('Error fetching user:', userError)
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Benutzerrolle überprüfen
    const userRole = userData.user.user_metadata?.role || payload.record.role
    const userEmail = userData.user.email
    const userName = payload.record.name || userData.user.user_metadata?.first_name || ''

    // Nur für Kunden fortfahren
    if (userRole !== 'CUSTOMER') {
      return new Response(JSON.stringify({ message: 'User is not a customer, no welcome email sent' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Willkommens-E-Mail-Vorlage abrufen
    const { data: template, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('name', 'Willkommen bei Contact Tables')
      .single()

    if (templateError || !template) {
      console.error('Error fetching welcome email template:', templateError)
      return new Response(JSON.stringify({ error: 'Welcome email template not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // SMTP-Einstellungen abrufen
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('smtp_host, smtp_port, smtp_user, smtp_password, contact_email, email_signature')
      .single()

    if (settingsError || !settings) {
      console.error('Error fetching SMTP settings:', settingsError)
      return new Response(JSON.stringify({ error: 'SMTP settings not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // E-Mail-Inhalt personalisieren
    let emailContent = template.content
    if (userName) {
      emailContent = emailContent.replace(/{name}/g, userName)
    }

    // E-Mail-Kampagne erstellen
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .insert({
        subject: template.subject,
        content: emailContent,
        status: 'processing',
        recipient_count: 1,
        sent_by: userId,
        template_id: template.id
      })
      .select('id')
      .single()

    if (campaignError) {
      console.error('Error creating email campaign:', campaignError)
      return new Response(JSON.stringify({ error: 'Failed to create email campaign' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // E-Mail-Empfänger hinzufügen
    const { error: recipientError } = await supabaseAdmin
      .from('email_recipients')
      .insert({
        campaign_id: campaign.id,
        recipient_id: userId,
        recipient_email: userEmail,
        status: 'pending'
      })

    if (recipientError) {
      console.error('Error adding email recipient:', recipientError)
    }

    // E-Mail senden mit vorhandenem E-Mail-Versand-System
    // @ts-ignore - Deno-spezifische Umgebungsvariablen
    const siteUrl = Deno.env.get('SITE_URL') || 'https://contact-tables.de'
    const response = await fetch(`${siteUrl}/api/admin/emails/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // @ts-ignore - Deno-spezifische Umgebungsvariablen
        'Authorization': `Bearer ${Deno.env.get('INTERNAL_API_SECRET')}`
      },
      body: JSON.stringify({
        recipients: [{ id: userId, email: userEmail, name: userName }],
        subject: template.subject,
        content: emailContent,
        templateId: template.id
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Failed to send email:', errorData)
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('Welcome email sent successfully for user:', userId)
    return new Response(JSON.stringify({ success: true, message: 'Welcome email sent successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Error in welcome-email function:', error)
    return new Response(JSON.stringify({ error: `Internal server error: ${error?.message || 'Unknown error'}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
