const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Prüfen, ob der Benutzer existiert oder erstellen
    let user = await prisma.users.findFirst({
      where: { email: 'info@consulting-smc.de' }
    });

    if (!user) {
      console.log('Benutzer wird erstellt...');
      user = await prisma.users.create({
        data: {
          email: 'info@consulting-smc.de',
          name: 'SMC Test',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log('Benutzer erstellt:', user);
    } else {
      console.log('Benutzer gefunden:', user);
    }

    // 2. Testkampagne erstellen
    const campaign = await prisma.email_campaigns.create({
      data: {
        subject: 'Testkampagne für Contact Tables',
        content: `
          <h1>Hallo {name},</h1>
          <p>Dies ist eine Testkampagne für das Kampagnen-Management-Feature von Contact Tables.</p>
          <p>Die Kampagne wurde automatisch erstellt, um zu testen, ob das Feature korrekt funktioniert.</p>
          <p>Wenn Sie diese E-Mail erhalten, war der Test erfolgreich!</p>
          <p>Mit freundlichen Grüßen,<br>Das Contact Tables Team</p>
        `,
        status: 'draft',
        schedule_type: 'immediate',
        sent_by: user.id
      }
    });
    console.log('Testkampagne erstellt:', campaign);

    // 3. Empfänger hinzufügen
    const recipient = await prisma.email_recipients.create({
      data: {
        campaign_id: campaign.id,
        recipient_id: user.id,
        recipient_email: 'info@consulting-smc.de',
        status: 'pending'
      }
    });
    console.log('Empfänger hinzugefügt:', recipient);

    // 4. Kampagne starten
    const updatedCampaign = await prisma.email_campaigns.update({
      where: { id: campaign.id },
      data: { status: 'active' }
    });
    console.log('Kampagne aktiviert:', updatedCampaign);

    // 5. Batch erstellen
    const batch = await prisma.email_batches.create({
      data: {
        campaign_id: campaign.id,
        status: 'pending'
      }
    });
    console.log('Batch erstellt:', batch);

    console.log('Testkampagne wurde erfolgreich erstellt und aktiviert.');
    console.log('Batch-ID:', batch.id);
    console.log('Um die E-Mail zu senden, rufen Sie den folgenden API-Endpunkt auf:');
    console.log(`/api/admin/emails/process-batch mit batch_id=${batch.id}`);

  } catch (error) {
    console.error('Fehler beim Erstellen der Testkampagne:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
