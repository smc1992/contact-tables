/*
  Warnings:

  - The `restaurant_id` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `restaurants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `RestaurantImage` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[stripe_subscription_id]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `restaurant_id` on the `Contract` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `restaurant_id` on the `contact_tables` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `restaurants` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Contract" DROP CONSTRAINT "Contract_restaurant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invoice" DROP CONSTRAINT "Invoice_restaurant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."RestaurantImage" DROP CONSTRAINT "RestaurantImage_restaurant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."contact_tables" DROP CONSTRAINT "contact_tables_restaurant_id_fkey";

-- AlterTable
ALTER TABLE "public"."Contract" DROP COLUMN "restaurant_id",
ADD COLUMN     "restaurant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."Invoice" DROP COLUMN "restaurant_id",
ADD COLUMN     "restaurant_id" UUID;

-- AlterTable
ALTER TABLE "public"."contact_tables" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "public"."EventStatus" NOT NULL DEFAULT 'OPEN',
DROP COLUMN "restaurant_id",
ADD COLUMN     "restaurant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."profiles" ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'CUSTOMER',
ADD COLUMN     "stripe_subscription_id" TEXT;

-- AlterTable
ALTER TABLE "public"."restaurants" DROP CONSTRAINT "restaurants_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "country" DROP NOT NULL,
ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."RestaurantImage";

-- CreateTable
CREATE TABLE "public"."restaurant_images" (
    "id" TEXT NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "restaurant_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_restaurant_id_key" ON "public"."Contract"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_stripe_subscription_id_key" ON "public"."profiles"("stripe_subscription_id");

-- AddForeignKey
ALTER TABLE "public"."contact_tables" ADD CONSTRAINT "contact_tables_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."restaurant_images" ADD CONSTRAINT "restaurant_images_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
