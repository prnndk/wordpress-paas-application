/*
  Warnings:

  - You are about to drop the column `php_version` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `wp_version` on the `tenants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `tenants` DROP COLUMN `php_version`,
    DROP COLUMN `wp_version`;
