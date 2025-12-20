-- AlterTable
ALTER TABLE `tenants` ADD COLUMN `wp_admin_email` VARCHAR(191) NULL,
    MODIFY `status` ENUM('creating', 'provisioning', 'running', 'starting', 'stopping', 'restarting', 'stopped', 'error', 'deleted') NOT NULL DEFAULT 'creating';
