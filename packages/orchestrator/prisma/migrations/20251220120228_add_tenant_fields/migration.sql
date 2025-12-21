/*
  Warnings:

  - The values [professional] on the enum `subscriptions_plan_id` will be removed. If these variants are still used in the database, this will fail.
  - The values [professional] on the enum `subscriptions_plan_id` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `subscriptions` MODIFY `plan_id` ENUM('free', 'starter', 'pro', 'business', 'enterprise') NOT NULL DEFAULT 'free';

-- AlterTable
ALTER TABLE `tenants` ADD COLUMN `cpu_cores` DOUBLE NOT NULL DEFAULT 1,
    ADD COLUMN `env_vars` TEXT NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `php_version` VARCHAR(191) NOT NULL DEFAULT '8.1',
    ADD COLUMN `ram_gb` DOUBLE NOT NULL DEFAULT 2,
    ADD COLUMN `region` VARCHAR(191) NOT NULL DEFAULT 'us-east-1',
    ADD COLUMN `slug` VARCHAR(191) NULL,
    ADD COLUMN `storage_gb` INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN `wp_version` VARCHAR(191) NOT NULL DEFAULT '6.4.1',
    MODIFY `plan_id` ENUM('free', 'starter', 'pro', 'business', 'enterprise') NOT NULL DEFAULT 'free',
    MODIFY `status` ENUM('creating', 'provisioning', 'running', 'stopped', 'error', 'deleted') NOT NULL DEFAULT 'creating';

-- CreateIndex
CREATE UNIQUE INDEX `tenants_slug_key` ON `tenants`(`slug`);

-- CreateIndex
CREATE INDEX `tenants_slug_idx` ON `tenants`(`slug`);
