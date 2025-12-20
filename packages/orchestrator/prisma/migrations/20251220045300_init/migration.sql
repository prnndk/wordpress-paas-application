-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenants` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subdomain` VARCHAR(191) NOT NULL,
    `db_name` VARCHAR(191) NOT NULL,
    `db_user` VARCHAR(191) NOT NULL,
    `db_password` VARCHAR(191) NOT NULL,
    `wp_admin_user` VARCHAR(191) NOT NULL DEFAULT 'admin',
    `wp_admin_password` VARCHAR(191) NULL,
    `plan_id` ENUM('free', 'starter', 'professional', 'enterprise') NOT NULL DEFAULT 'free',
    `replicas` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('creating', 'running', 'stopped', 'error', 'deleted') NOT NULL DEFAULT 'creating',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tenants_subdomain_key`(`subdomain`),
    INDEX `tenants_user_id_idx`(`user_id`),
    INDEX `tenants_subdomain_idx`(`subdomain`),
    INDEX `tenants_status_idx`(`status`),
    INDEX `tenants_plan_id_idx`(`plan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `plan_id` ENUM('free', 'starter', 'professional', 'enterprise') NOT NULL DEFAULT 'free',
    `status` ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
    `start_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `end_date` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `subscriptions_user_id_idx`(`user_id`),
    INDEX `subscriptions_status_idx`(`status`),
    INDEX `subscriptions_end_date_idx`(`end_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
