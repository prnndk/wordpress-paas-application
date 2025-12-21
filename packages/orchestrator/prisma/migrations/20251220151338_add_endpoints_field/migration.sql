/*
  Warnings:

  - You are about to drop the column `subdomain` on the `tenants` table. All the data in the column will be lost.
  - Made the column `slug` on table `tenants` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `tenants_subdomain_idx` ON `tenants`;

-- DropIndex
DROP INDEX `tenants_subdomain_key` ON `tenants`;

-- AlterTable
ALTER TABLE `tenants` DROP COLUMN `subdomain`,
    ADD COLUMN `endpoints` TEXT NULL,
    MODIFY `slug` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `checkouts` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'success', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `checkouts_user_id_idx`(`user_id`),
    INDEX `checkouts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `checkouts` ADD CONSTRAINT `checkouts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
