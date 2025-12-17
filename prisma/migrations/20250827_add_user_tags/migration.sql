-- CreateTable
CREATE TABLE "user_tags" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "user_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tag_assignments" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "tag_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "user_tag_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_tags_name_key" ON "user_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_tag_assignments_user_id_tag_id_key" ON "user_tag_assignments"("user_id", "tag_id");

-- AddForeignKey
ALTER TABLE "user_tag_assignments" ADD CONSTRAINT "user_tag_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tag_assignments" ADD CONSTRAINT "user_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "user_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add rate limiting settings to system_settings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
        CREATE TABLE "system_settings" (
            "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
            "key" TEXT NOT NULL,
            "value" JSONB NOT NULL,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL,
            
            CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
        );
        
        CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");
    END IF;
END
$$;

-- Insert default email rate limit settings
INSERT INTO "system_settings" ("key", "value", "updated_at")
VALUES ('email_rate_limits', '{"hourly_limit": 400, "batch_size": 400, "cooldown_minutes": 60}', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE
SET "value" = '{"hourly_limit": 400, "batch_size": 400, "cooldown_minutes": 60}', "updated_at" = CURRENT_TIMESTAMP;

-- Add scheduled_at field to email_campaigns table
ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP(3);

-- Add batch_id field to email_recipients table
ALTER TABLE "email_recipients" ADD COLUMN IF NOT EXISTS "batch_id" TEXT;
