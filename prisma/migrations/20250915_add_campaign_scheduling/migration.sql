-- AlterTable: Erweitere email_campaigns um Zeitplanungsfunktionen
ALTER TABLE "public"."email_campaigns" 
ADD COLUMN "schedule_type" TEXT NOT NULL DEFAULT 'immediate',
ADD COLUMN "scheduled_at" TIMESTAMPTZ,
ADD COLUMN "recurring_config" JSONB,
ADD COLUMN "target_config" JSONB DEFAULT '{"segment_type": "all"}';

-- CreateEnum: Kampagnenstatus
CREATE TYPE "public"."CampaignStatus" AS ENUM (
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'failed'
);

-- AlterTable: Konvertiere status zu ENUM
ALTER TABLE "public"."email_campaigns" 
ALTER COLUMN "status" TYPE "public"."CampaignStatus" 
USING "status"::"public"."CampaignStatus";

-- CreateIndex: Indizes für effiziente Abfragen
CREATE INDEX "email_campaigns_schedule_type_idx" ON "public"."email_campaigns"("schedule_type");
CREATE INDEX "email_campaigns_scheduled_at_idx" ON "public"."email_campaigns"("scheduled_at");

-- Kommentar
COMMENT ON COLUMN "public"."email_campaigns"."schedule_type" IS 'Art der Zeitplanung: immediate, scheduled, recurring';
COMMENT ON COLUMN "public"."email_campaigns"."scheduled_at" IS 'Zeitpunkt für geplante Kampagnen';
COMMENT ON COLUMN "public"."email_campaigns"."recurring_config" IS 'Konfiguration für wiederkehrende Kampagnen (JSON)';
COMMENT ON COLUMN "public"."email_campaigns"."target_config" IS 'Zielgruppen-Konfiguration (JSON)';
