/*
  Warnings:

  - You are about to drop the column `event_id` on the `favorites` table. All the data in the column will be lost.
  - You are about to drop the column `event_id` on the `ratings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,restaurant_id]` on the table `favorites` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,restaurant_id]` on the table `ratings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `restaurant_id` to the `favorites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restaurant_id` to the `ratings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."favorites" DROP CONSTRAINT "favorites_event_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ratings" DROP CONSTRAINT "ratings_event_id_fkey";

-- DropIndex
DROP INDEX "public"."favorites_user_id_event_id_key";

-- DropIndex
DROP INDEX "public"."ratings_user_id_event_id_key";

-- AlterTable
ALTER TABLE "public"."favorites" DROP COLUMN "event_id",
ADD COLUMN     "restaurant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."ratings" DROP COLUMN "event_id",
ADD COLUMN     "restaurant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."restaurants" ADD COLUMN     "privacy_settings" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_restaurant_id_key" ON "public"."favorites"("user_id", "restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_user_id_restaurant_id_key" ON "public"."ratings"("user_id", "restaurant_id");

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
