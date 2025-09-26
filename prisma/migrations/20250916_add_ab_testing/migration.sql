-- Erweiterung des Datenbankschemas für A/B-Testing
ALTER TABLE "public"."email_campaigns" 
ADD COLUMN "is_ab_test" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "parent_campaign_id" UUID REFERENCES "public"."email_campaigns"(id) ON DELETE SET NULL,
ADD COLUMN "variant_name" TEXT,
ADD COLUMN "variant_type" TEXT;

-- Tabelle für A/B-Test-Ergebnisse
CREATE TABLE "public"."ab_test_results" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "test_id" UUID NOT NULL,
  "variant_id" UUID NOT NULL,
  "metric" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "ab_test_results_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ab_test_results_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "public"."email_campaigns"("id") ON DELETE CASCADE,
  CONSTRAINT "ab_test_results_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."email_campaigns"("id") ON DELETE CASCADE
);

-- Indizes für schnellere Abfragen
CREATE INDEX "email_campaigns_is_ab_test_idx" ON "public"."email_campaigns"("is_ab_test");
CREATE INDEX "email_campaigns_parent_campaign_id_idx" ON "public"."email_campaigns"("parent_campaign_id");
CREATE INDEX "ab_test_results_test_id_idx" ON "public"."ab_test_results"("test_id");
CREATE INDEX "ab_test_results_variant_id_idx" ON "public"."ab_test_results"("variant_id");

-- Kommentare
COMMENT ON COLUMN "public"."email_campaigns"."is_ab_test" IS 'Gibt an, ob diese Kampagne Teil eines A/B-Tests ist';
COMMENT ON COLUMN "public"."email_campaigns"."parent_campaign_id" IS 'ID der Hauptkampagne, wenn diese Kampagne eine Variante ist';
COMMENT ON COLUMN "public"."email_campaigns"."variant_name" IS 'Name der Variante (z.B. "A", "B", "Original")';
COMMENT ON COLUMN "public"."email_campaigns"."variant_type" IS 'Art der Variante (z.B. "subject", "content")';

COMMENT ON TABLE "public"."ab_test_results" IS 'Speichert die Ergebnisse von A/B-Tests';
COMMENT ON COLUMN "public"."ab_test_results"."test_id" IS 'ID der Hauptkampagne des Tests';
COMMENT ON COLUMN "public"."ab_test_results"."variant_id" IS 'ID der Variante';
COMMENT ON COLUMN "public"."ab_test_results"."metric" IS 'Gemessene Metrik (z.B. "open_rate", "click_rate")';
COMMENT ON COLUMN "public"."ab_test_results"."value" IS 'Wert der Metrik';
