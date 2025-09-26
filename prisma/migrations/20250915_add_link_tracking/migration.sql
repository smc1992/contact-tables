-- CreateTable: Tabelle für Link-Tracking erstellen
CREATE TABLE "public"."email_link_clicks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "campaign_id" UUID NOT NULL,
  "recipient_id" UUID,
  "recipient_email" TEXT NOT NULL,
  "link_url" TEXT NOT NULL,
  "link_id" TEXT NOT NULL,
  "clicked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "user_agent" TEXT,
  "ip_address" TEXT,
  
  CONSTRAINT "email_link_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Indizes für schnelle Abfragen
CREATE INDEX "email_link_clicks_campaign_id_idx" ON "public"."email_link_clicks"("campaign_id");
CREATE INDEX "email_link_clicks_recipient_email_idx" ON "public"."email_link_clicks"("recipient_email");
CREATE INDEX "email_link_clicks_link_id_idx" ON "public"."email_link_clicks"("link_id");
CREATE INDEX "email_link_clicks_clicked_at_idx" ON "public"."email_link_clicks"("clicked_at");

-- AddForeignKey: Fremdschlüssel für Kampagnen-Verknüpfung
ALTER TABLE "public"."email_link_clicks" ADD CONSTRAINT "email_link_clicks_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Kommentar
COMMENT ON TABLE "public"."email_link_clicks" IS 'Speichert Klicks auf Links in E-Mail-Kampagnen';
