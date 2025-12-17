-- Create email_campaigns table
CREATE TABLE "email_campaigns" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "recipient_count" INTEGER NOT NULL DEFAULT 0,
  "sent_count" INTEGER NOT NULL DEFAULT 0,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "sent_by" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),

  CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- Create email_recipients table
CREATE TABLE "email_recipients" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "campaign_id" UUID NOT NULL,
  "recipient_id" UUID NOT NULL,
  "recipient_email" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "error_message" TEXT,
  "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "email_recipients_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns"("status");
CREATE INDEX "email_campaigns_sent_by_idx" ON "email_campaigns"("sent_by");
CREATE INDEX "email_recipients_campaign_id_idx" ON "email_recipients"("campaign_id");
CREATE INDEX "email_recipients_recipient_id_idx" ON "email_recipients"("recipient_id");
CREATE INDEX "email_recipients_status_idx" ON "email_recipients"("status");

-- Add email_templates table
CREATE TABLE "email_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- Add some default templates
INSERT INTO "email_templates" ("name", "subject", "content") VALUES
('Willkommen', 'Willkommen bei Contact Tables', '<h2>Willkommen bei Contact Tables!</h2><p>Hallo {name},</p><p>wir freuen uns, dass Sie sich bei Contact Tables registriert haben. Mit unserem Service können Sie einfach und bequem Kontakttische in Restaurants finden und buchen.</p><p>Entdecken Sie jetzt die besten Restaurants in Ihrer Nähe und knüpfen Sie neue Kontakte!</p><p>Mit freundlichen Grüßen,<br>Ihr Contact Tables Team</p>'),
('Newsletter', 'Neuigkeiten von Contact Tables', '<h2>Neuigkeiten von Contact Tables</h2><p>Hallo {name},</p><p>hier sind die neuesten Neuigkeiten und Angebote von Contact Tables:</p><ul><li>Neue Restaurants in Ihrer Nähe</li><li>Kommende Events und Kontakttische</li><li>Exklusive Angebote für unsere Mitglieder</li></ul><p>Wir wünschen Ihnen einen schönen Tag!</p><p>Mit freundlichen Grüßen,<br>Ihr Contact Tables Team</p>');
