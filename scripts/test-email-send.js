// Test-Skript für den E-Mail-Versand
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Erstelle einen Supabase-Client mit dem Service Role Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Umgebungsvariablen fehlen: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testEmailCampaignCreation() {
  console.log('=== Test E-Mail-Kampagne erstellen ===');
  
  try {
    // Erstelle eine Test-E-Mail-Kampagne
    const { data: emailCampaign, error } = await adminClient
      .from('email_campaigns')
      .insert({
        subject: 'Test-E-Mail-Kampagne',
        content: '<p>Dies ist eine Test-E-Mail.</p>',
        recipient_count: 1,
        status: 'draft',
        sent_by: '6b34ebc2-f57e-4881-b064-71b6bf1b99dc' // Ersetzen Sie dies mit einer gültigen Benutzer-ID
      })
      .select('id')
      .single();

    if (error) {
      console.error('Fehler beim Erstellen der E-Mail-Kampagne:', error);
      return;
    }

    console.log('E-Mail-Kampagne erfolgreich erstellt:', emailCampaign);

    // Erstelle einen Test-E-Mail-Batch
    const { data: emailBatch, error: batchError } = await adminClient
      .from('email_batches')
      .insert({
        campaign_id: emailCampaign.id,
        status: 'pending',
        recipient_count: 1
      })
      .select('id')
      .single();

    if (batchError) {
      console.error('Fehler beim Erstellen des E-Mail-Batches:', batchError);
      return;
    }

    console.log('E-Mail-Batch erfolgreich erstellt:', emailBatch);

    // Füge einen Test-Empfänger hinzu
    const { error: recipientError } = await adminClient
      .from('email_recipients')
      .insert({
        campaign_id: emailCampaign.id,
        batch_id: emailBatch.id,
        recipient_id: '6b34ebc2-f57e-4881-b064-71b6bf1b99dc', // Ersetzen Sie dies mit einer gültigen Benutzer-ID
        recipient_email: 'test@example.com', // Ersetzen Sie dies mit einer gültigen E-Mail-Adresse
        status: 'pending'
      });

    if (recipientError) {
      console.error('Fehler beim Hinzufügen des Empfängers:', recipientError);
      return;
    }

    console.log('Empfänger erfolgreich hinzugefügt');
    console.log('Test erfolgreich abgeschlossen!');
  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
  }
}

testEmailCampaignCreation();
