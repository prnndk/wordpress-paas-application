-- CreateTable
CREATE TABLE `scheduled_maintenances` (
    `id` VARCHAR(191) NOT NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `target_image` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `force_update` BOOLEAN NOT NULL DEFAULT false,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `services_updated` TEXT NULL,
    `errors` TEXT NULL,
    `announcement_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `scheduled_maintenances_scheduled_at_idx`(`scheduled_at`),
    INDEX `scheduled_maintenances_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
