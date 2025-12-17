-- Füge neue Felder zu email_campaigns hinzu
ALTER TABLE "public"."email_campaigns" ADD COLUMN IF NOT EXISTS "skipped_count" INTEGER DEFAULT 0;
ALTER TABLE "public"."email_campaigns" ADD COLUMN IF NOT EXISTS "processing_time" FLOAT;
ALTER TABLE "public"."email_campaigns" ADD COLUMN IF NOT EXISTS "send_rate" FLOAT;
ALTER TABLE "public"."email_campaigns" ADD COLUMN IF NOT EXISTS "campaign_metrics" JSONB;

-- Füge delivery_info zu email_recipients hinzu
ALTER TABLE "public"."email_recipients" ADD COLUMN IF NOT EXISTS "delivery_info" JSONB;

-- Aktualisiere den EmailRecipientStatus Enum um SKIPPED zu unterstützen
-- (Bereits in Schema vorhanden, daher kein ALTER TYPE notwendig)

-- Erstelle Index für schnellere Abfragen nach Status und Kampagne
CREATE INDEX IF NOT EXISTS "email_recipients_campaign_id_status_idx" ON "public"."email_recipients"("campaign_id", "status");
