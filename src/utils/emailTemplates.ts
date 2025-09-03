/**
 * E-Mail-Vorlagen mit responsivem Design
 * Diese Vorlagen sind für alle E-Mail-Clients und Geräte optimiert
 */

interface TemplateData {
  title: string;
  preheader?: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
  signature?: string;
}

/**
 * Erstellt eine responsive E-Mail-Vorlage
 */
export function createResponsiveEmailTemplate(data: TemplateData): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>${data.title}</title>
  <style>
    @media only screen and (max-width: 620px) {
      table.body h1 {
        font-size: 28px !important;
        margin-bottom: 10px !important;
      }
      table.body p,
      table.body ul,
      table.body ol,
      table.body td,
      table.body span,
      table.body a {
        font-size: 16px !important;
      }
      table.body .wrapper,
      table.body .article {
        padding: 10px !important;
      }
      table.body .content {
        padding: 0 !important;
      }
      table.body .container {
        padding: 0 !important;
        width: 100% !important;
      }
      table.body .main {
        border-left-width: 0 !important;
        border-radius: 0 !important;
        border-right-width: 0 !important;
      }
      table.body .btn table {
        width: 100% !important;
      }
      table.body .btn a {
        width: 100% !important;
      }
      table.body .img-responsive {
        height: auto !important;
        max-width: 100% !important;
        width: auto !important;
      }
    }
    @media all {
      .ExternalClass {
        width: 100%;
      }
      .ExternalClass,
      .ExternalClass p,
      .ExternalClass span,
      .ExternalClass font,
      .ExternalClass td,
      .ExternalClass div {
        line-height: 100%;
      }
      .apple-link a {
        color: inherit !important;
        font-family: inherit !important;
        font-size: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
        text-decoration: none !important;
      }
      #MessageViewBody a {
        color: inherit;
        text-decoration: none;
        font-size: inherit;
        font-family: inherit;
        font-weight: inherit;
        line-height: inherit;
      }
      .btn-primary table td:hover {
        background-color: #3850b7 !important;
      }
      .btn-primary a:hover {
        background-color: #3850b7 !important;
        border-color: #3850b7 !important;
      }
    }
  </style>
</head>
<body style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
  <span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;">${data.preheader || data.title}</span>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f6f6f6; width: 100%;" width="100%" bgcolor="#f6f6f6">
    <tr>
      <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
      <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; max-width: 580px; padding: 10px; width: 580px; margin: 0 auto;" width="580" valign="top">
        <div class="content" style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 580px; padding: 10px;">

          <!-- START CENTERED WHITE CONTAINER -->
          <table role="presentation" class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background: #ffffff; border-radius: 3px; width: 100%;" width="100%">

            <!-- START MAIN CONTENT AREA -->
            <tr>
              <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;" valign="top">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
                  <tr>
                    <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">
                      <h1 style="color: #4f46e5; font-family: sans-serif; font-weight: 600; line-height: 1.4; margin: 0; margin-bottom: 20px; font-size: 32px; text-align: left;">${data.title}</h1>
                      <div style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">
                        ${data.content}
                      </div>
                      ${data.buttonText && data.buttonUrl ? `
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; box-sizing: border-box; width: 100%;" width="100%">
                        <tbody>
                          <tr>
                            <td align="left" style="font-family: sans-serif; font-size: 14px; vertical-align: top; padding-bottom: 15px;" valign="top">
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: auto;">
                                <tbody>
                                  <tr>
                                    <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; border-radius: 5px; text-align: center; background-color: #4f46e5;" valign="top" align="center" bgcolor="#4f46e5">
                                      <a href="${data.buttonUrl}" target="_blank" style="border: solid 1px #4f46e5; border-radius: 5px; box-sizing: border-box; cursor: pointer; display: inline-block; font-size: 14px; font-weight: bold; margin: 0; padding: 12px 25px; text-decoration: none; text-transform: capitalize; background-color: #4f46e5; border-color: #4f46e5; color: #ffffff;">${data.buttonText}</a>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      ` : ''}
                      ${data.signature ? `
                      <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
                        ${data.signature}
                      </div>
                      ` : ''}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          <!-- END MAIN CONTENT AREA -->
          </table>
          <!-- END CENTERED WHITE CONTAINER -->

          <!-- START FOOTER -->
          <div class="footer" style="clear: both; margin-top: 10px; text-align: center; width: 100%;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
              <tr>
                <td class="content-block" style="font-family: sans-serif; vertical-align: top; padding-bottom: 10px; padding-top: 10px; color: #999999; font-size: 12px; text-align: center;" valign="top" align="center">
                  ${data.footerText || '© Contact Tables. Alle Rechte vorbehalten.'}
                </td>
              </tr>
            </table>
          </div>
          <!-- END FOOTER -->

        </div>
      </td>
      <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Erstellt eine Reservierungsbestätigungs-E-Mail
 */
export function createReservationConfirmationEmail(
  name: string,
  restaurantName: string,
  date: string,
  time: string,
  guests: number,
  reservationId: string,
  cancelUrl: string,
  signature?: string
): string {
  const content = `
    <p>Hallo ${name},</p>
    <p>vielen Dank für Ihre Reservierung bei <strong>${restaurantName}</strong>.</p>
    <p>Hier sind Ihre Reservierungsdetails:</p>
    <ul>
      <li><strong>Datum:</strong> ${date}</li>
      <li><strong>Uhrzeit:</strong> ${time}</li>
      <li><strong>Anzahl der Gäste:</strong> ${guests}</li>
      <li><strong>Reservierungs-ID:</strong> ${reservationId}</li>
    </ul>
    <p>Wir freuen uns auf Ihren Besuch!</p>
    <p>Falls sich Ihre Pläne ändern sollten, können Sie Ihre Reservierung jederzeit stornieren oder ändern.</p>
  `;

  return createResponsiveEmailTemplate({
    title: 'Ihre Reservierung wurde bestätigt',
    preheader: `Reservierung bei ${restaurantName} am ${date} um ${time}`,
    content,
    buttonText: 'Reservierung stornieren',
    buttonUrl: cancelUrl,
    signature,
    footerText: '© Contact Tables. Sie erhalten diese E-Mail, weil Sie eine Reservierung getätigt haben.'
  });
}

/**
 * Erstellt eine Test-E-Mail
 */
export function createTestEmail(
  name: string,
  timestamp: string,
  signature?: string
): string {
  const content = `
    <p>Hallo ${name},</p>
    <p>dies ist eine Test-E-Mail, um zu überprüfen, ob Ihr E-Mail-System korrekt konfiguriert ist.</p>
    <p>Wenn Sie diese E-Mail erhalten, funktioniert Ihre SMTP-Konfiguration korrekt!</p>
    <p><strong>Zeitstempel:</strong> ${timestamp}</p>
    <p>Mit freundlichen Grüßen,<br>Ihr Contact Tables System</p>
  `;

  return createResponsiveEmailTemplate({
    title: 'Contact Tables E-Mail-Test',
    preheader: 'Diese E-Mail bestätigt, dass Ihr E-Mail-System korrekt konfiguriert ist',
    content,
    signature
  });
}
