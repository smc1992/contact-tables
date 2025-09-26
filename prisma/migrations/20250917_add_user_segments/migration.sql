-- Tabelle für Benutzersegmente
CREATE TABLE "public"."user_segments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "criteria" JSONB NOT NULL,
  "is_dynamic" BOOLEAN NOT NULL DEFAULT true,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "user_segments_pkey" PRIMARY KEY ("id")
);

-- Tabelle für Benutzer in Segmenten
CREATE TABLE "public"."user_segment_members" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "segment_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "added_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "score" DOUBLE PRECISION,
  
  CONSTRAINT "user_segment_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_segment_members_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "public"."user_segments"("id") ON DELETE CASCADE,
  CONSTRAINT "user_segment_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  CONSTRAINT "user_segment_members_segment_user_unique" UNIQUE ("segment_id", "user_id")
);

-- Tabelle für Benutzerverhalten und Engagement
CREATE TABLE "public"."user_engagement" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "event_type" TEXT NOT NULL,
  "event_data" JSONB,
  "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "user_engagement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_engagement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

-- Indizes für schnellere Abfragen
CREATE INDEX "user_segments_is_dynamic_idx" ON "public"."user_segments"("is_dynamic");
CREATE INDEX "user_segment_members_segment_id_idx" ON "public"."user_segment_members"("segment_id");
CREATE INDEX "user_segment_members_user_id_idx" ON "public"."user_segment_members"("user_id");
CREATE INDEX "user_engagement_user_id_idx" ON "public"."user_engagement"("user_id");
CREATE INDEX "user_engagement_event_type_idx" ON "public"."user_engagement"("event_type");
CREATE INDEX "user_engagement_occurred_at_idx" ON "public"."user_engagement"("occurred_at");

-- Kommentare
COMMENT ON TABLE "public"."user_segments" IS 'Definiert Benutzersegmente basierend auf Verhalten und Eigenschaften';
COMMENT ON COLUMN "public"."user_segments"."criteria" IS 'JSON-Kriterien für die Segmentierung (z.B. {"engagement": "high", "last_active_days": 30})';
COMMENT ON COLUMN "public"."user_segments"."is_dynamic" IS 'Gibt an, ob das Segment dynamisch aktualisiert wird';

COMMENT ON TABLE "public"."user_segment_members" IS 'Speichert die Zugehörigkeit von Benutzern zu Segmenten';
COMMENT ON COLUMN "public"."user_segment_members"."score" IS 'Optionaler Score für die Stärke der Segmentzugehörigkeit';

COMMENT ON TABLE "public"."user_engagement" IS 'Speichert Benutzerverhalten und Engagement-Ereignisse';
COMMENT ON COLUMN "public"."user_engagement"."event_type" IS 'Art des Ereignisses (z.B. email_open, link_click, page_view)';
COMMENT ON COLUMN "public"."user_engagement"."event_data" IS 'Zusätzliche Daten zum Ereignis';
