-- Baseline migration after prisma db push
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('CUSTOMER', 'RESTAURANT', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."Language" AS ENUM ('DE', 'EN', 'ES', 'PT', 'FR');

-- CreateEnum
CREATE TYPE "public"."ContractStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED', 'REJECTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('OPEN', 'FULL', 'CLOSED', 'PAST');

-- CreateEnum
CREATE TYPE "public"."CmsSectionType" AS ENUM ('HERO', 'FEATURE', 'FOOTER', 'TESTIMONIAL', 'BANNER');

-- CreateEnum
CREATE TYPE "public"."ContactMessageStatus" AS ENUM ('NEW', 'READ', 'REPLIED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "language_code" TEXT DEFAULT 'DE',
    "is_paying" BOOLEAN DEFAULT false,
    "stripe_customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."restaurants" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postal_code" TEXT,
    "country" TEXT NOT NULL,
    "description" TEXT,
    "booking_url" TEXT,
    "image_url" TEXT,
    "cuisine" TEXT,
    "capacity" INTEGER,
    "contract_start_date" TIMESTAMP(3),
    "trial_end_date" TIMESTAMP(3),
    "contract_status" "public"."ContractStatus" NOT NULL DEFAULT 'PENDING',
    "is_visible" BOOLEAN NOT NULL DEFAULT false,
    "offer_table_today" BOOLEAN NOT NULL DEFAULT false,
    "stripe_subscription_id" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "opening_hours" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "price_range" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "plan" TEXT,
    "contract_token" TEXT,
    "contract_token_expires_at" TIMESTAMP(3),
    "contract_accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact_tables" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "datetime" TIMESTAMP(3) NOT NULL,
    "max_participants" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "restaurant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."participations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "is_host" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripe_invoice_id" TEXT NOT NULL,
    "download_url" TEXT NOT NULL,
    "user_id" UUID,
    "restaurant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RestaurantImage" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contract" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "status" "public"."ContractStatus" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "trial_end_date" TIMESTAMP(3),
    "cancellation_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Translation" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "language_code" "public"."Language" NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "public"."ContactMessageStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CmsSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "language_code" "public"."Language" NOT NULL,
    "type" "public"."CmsSectionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."favorites" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ratings" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT,
    "user_id" UUID NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "receive_newsletter" BOOLEAN NOT NULL DEFAULT true,
    "event_reminders" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."partner_requests" (
    "id" TEXT NOT NULL,
    "restaurant_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" UUID NOT NULL,
    "can_manage_users" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_settings" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_stripe_customer_id_key" ON "public"."profiles"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_userId_key" ON "public"."restaurants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_contract_token_key" ON "public"."restaurants"("contract_token");

-- CreateIndex
CREATE UNIQUE INDEX "participations_event_id_user_id_key" ON "public"."participations"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripe_invoice_id_key" ON "public"."Invoice"("stripe_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_restaurant_id_key" ON "public"."Contract"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "Translation_key_language_code_key" ON "public"."Translation"("key", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "CmsSection_key_language_code_key" ON "public"."CmsSection"("key", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_event_id_key" ON "public"."favorites"("user_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_user_id_event_id_key" ON "public"."ratings"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "public"."notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "public"."user_settings"("user_id");

-- AddForeignKey
ALTER TABLE "public"."restaurants" ADD CONSTRAINT "restaurants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_tables" ADD CONSTRAINT "contact_tables_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."participations" ADD CONSTRAINT "participations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."contact_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."participations" ADD CONSTRAINT "participations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RestaurantImage" ADD CONSTRAINT "RestaurantImage_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."contact_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."contact_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admins" ADD CONSTRAINT "admin_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
