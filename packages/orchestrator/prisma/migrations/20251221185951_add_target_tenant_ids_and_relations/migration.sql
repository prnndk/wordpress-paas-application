-- AlterTable
ALTER TABLE `scheduled_maintenances` ADD COLUMN `target_tenant_ids` TEXT NULL;

-- AddForeignKey
ALTER TABLE `scheduled_maintenances` ADD CONSTRAINT `scheduled_maintenances_announcement_id_fkey` FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
