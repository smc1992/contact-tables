// Supabase Edge Function für E-Mail-Bestätigung
// Diese Funktion sendet Bestätigungs-E-Mails über SMTP

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

interface EmailPayload {
  to: string
  // Optional direct action link from Supabase generateLink
  actionLink?: string
  // Optional OTP/token values (used only if no actionLink is provided)
  token?: string
  tokenHash?: string
  type: string
  redirectTo?: string
}

serve(async (req) => {
  try {
    // CORS-Header für Anfragen von der Anwendung
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    // Nur POST-Anfragen erlauben
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Umgebungsvariablen für SMTP-Konfiguration
    const smtpHost = Deno.env.get('SMTP_HOSTNAME')
    const smtpPort = Number(Deno.env.get('SMTP_PORT'))
    const smtpUser = Deno.env.get('SMTP_USERNAME')
    const smtpPass = Deno.env.get('SMTP_PASSWORD')
    const smtpFrom = Deno.env.get('SMTP_FROM')
    const siteUrl = Deno.env.get('SITE_URL')
    const verifyBaseUrlEnv = Deno.env.get('VERIFY_BASE_URL')
    const effectiveBaseUrl = verifyBaseUrlEnv || siteUrl

    // Prüfen, ob alle erforderlichen Umgebungsvariablen vorhanden sind
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom || !effectiveBaseUrl) {
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: Missing SMTP environment variables or base URL',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Anfragedaten parsen
    const { to, token, tokenHash, actionLink, type, redirectTo } = await req.json() as EmailPayload

    // Prüfen, ob alle erforderlichen Daten vorhanden sind
    if (!to || !type) {
      return new Response(
        JSON.stringify({
          error: 'Bad request: Missing required fields',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // SMTP-Client konfigurieren
    const client = new SmtpClient()
    await client.connectTLS({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUser,
      password: smtpPass,
    })

    // E-Mail-Betreff und -Inhalt basierend auf dem Typ festlegen
    let subject = ''
    let htmlBody = ''
    let textBody = ''

    // Bestätigungslink bestimmen: bevorzugt über den direkt gelieferten actionLink
    const confirmationUrl = actionLink && actionLink.length > 0
      ? actionLink
      : `${effectiveBaseUrl}/auth/confirm?token_hash=${tokenHash ?? ''}&type=${type}${
          redirectTo ? `&next=${encodeURIComponent(redirectTo)}` : ''
        }`

    switch (type) {
      case 'signup':
        subject = 'Bestätigen Sie Ihre E-Mail-Adresse'
        htmlBody = `
          <h2>Bestätigen Sie Ihre Registrierung</h2>
          <p>Klicken Sie auf den folgenden Link, um Ihre E-Mail-Adresse zu bestätigen:</p>
          <p><a href="${confirmationUrl}">E-Mail-Adresse bestätigen</a></p>
          <p>Alternativ können Sie diesen Code eingeben: ${token ?? ''}</p>
        `
        textBody = `
          Bestätigen Sie Ihre Registrierung
          
          Klicken Sie auf den folgenden Link, um Ihre E-Mail-Adresse zu bestätigen:
          ${confirmationUrl}
          
          Alternativ können Sie diesen Code eingeben: ${token}
        `
        break
      case 'recovery':
        subject = 'Passwort zurücksetzen'
        htmlBody = `
          <h2>Passwort zurücksetzen</h2>
          <p>Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:</p>
          <p><a href="${confirmationUrl}">Passwort zurücksetzen</a></p>
          <p>Alternativ können Sie diesen Code eingeben: ${token}</p>
        `
        textBody = `
          Passwort zurücksetzen
          
          Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:
          ${confirmationUrl}
          
          Alternativ können Sie diesen Code eingeben: ${token}
        `
        break
      default:
        subject = 'Bestätigung erforderlich'
        htmlBody = `
          <h2>Bestätigung erforderlich</h2>
          <p>Klicken Sie auf den folgenden Link zur Bestätigung:</p>
          <p><a href="${confirmationUrl}">Bestätigen</a></p>
          <p>Alternativ können Sie diesen Code eingeben: ${token}</p>
        `
        textBody = `
          Bestätigung erforderlich
          
          Klicken Sie auf den folgenden Link zur Bestätigung:
          ${confirmationUrl}
          
          Alternativ können Sie diesen Code eingeben: ${token}
        `
    }

    // E-Mail senden
    await client.send({
      from: smtpFrom,
      to,
      subject,
      content: htmlBody,
      html: htmlBody,
    })

    await client.close()

    // Erfolgreiche Antwort
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    // Fehlerbehandlung
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({
        error: `Failed to send email: ${error.message}`,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
