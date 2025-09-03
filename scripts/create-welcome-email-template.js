// Script zum Erstellen einer Standard-Willkommens-E-Mail-Vorlage
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Umgebungsvariablen NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const welcomeEmailTemplate = {
  name: 'Willkommen bei Contact Tables',
  subject: 'Willkommen bei Contact Tables - Ihre Registrierung war erfolgreich',
  content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Willkommen bei Contact Tables</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }
    .header {
      background-color: #4f46e5;
      padding: 20px;
      text-align: center;
      color: white;
    }
    .content {
      padding: 20px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 15px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Willkommen bei Contact Tables!</h1>
  </div>
  <div class="content">
    <p>Hallo {{name}},</p>
    
    <p>herzlichen Dank für Ihre Registrierung bei Contact Tables. Wir freuen uns, Sie als neuen Kunden begrüßen zu dürfen!</p>
    
    <p>Mit Contact Tables können Sie:</p>
    <ul>
      <li>Interessante Restaurants in Ihrer Nähe entdecken</li>
      <li>An exklusiven Dinner-Events teilnehmen</li>
      <li>Neue Kontakte knüpfen und Ihr Netzwerk erweitern</li>
    </ul>
    
    <p>Um Ihr Profil zu vervollständigen und alle Funktionen zu nutzen, klicken Sie bitte auf den folgenden Button:</p>
    
    <a href="https://contact-tables.de/customer/dashboard" class="button">Zum Dashboard</a>
    
    <p>Falls Sie Fragen haben oder Hilfe benötigen, zögern Sie nicht, uns zu kontaktieren.</p>
    
    <p>Mit freundlichen Grüßen,<br>
    Ihr Contact Tables Team</p>
  </div>
  <div class="footer">
    <p>© 2025 Contact Tables. Alle Rechte vorbehalten.</p>
    <p><a href="{{unsubscribe_url}}">Abmelden</a></p>
  </div>
</body>
</html>`
};

async function createWelcomeTemplate() {
  try {
    // Prüfen, ob die Vorlage bereits existiert
    const { data: existingTemplates, error: fetchError } = await supabase
      .from('email_templates')
      .select('id')
      .eq('name', welcomeEmailTemplate.name);
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (existingTemplates && existingTemplates.length > 0) {
      console.log('Willkommens-E-Mail-Vorlage existiert bereits. Aktualisiere...');
      
      const { data, error } = await supabase
        .from('email_templates')
        .update({
          subject: welcomeEmailTemplate.subject,
          content: welcomeEmailTemplate.content
        })
        .eq('name', welcomeEmailTemplate.name)
        .select();
      
      if (error) throw error;
      console.log('Willkommens-E-Mail-Vorlage erfolgreich aktualisiert:', data);
    } else {
      console.log('Erstelle neue Willkommens-E-Mail-Vorlage...');
      
      const { data, error } = await supabase
        .from('email_templates')
        .insert(welcomeEmailTemplate)
        .select();
      
      if (error) throw error;
      console.log('Willkommens-E-Mail-Vorlage erfolgreich erstellt:', data);
    }
  } catch (error) {
    console.error('Fehler beim Erstellen/Aktualisieren der Willkommens-E-Mail-Vorlage:', error);
  }
}

createWelcomeTemplate();
