-- AlterTable
ALTER TABLE `subscriptions` MODIFY `plan_id` ENUM('free', 'hobby', 'starter', 'starter_plus', 'pro', 'pro_plus', 'business', 'business_plus', 'agency', 'enterprise') NOT NULL DEFAULT 'free';

-- AlterTable
ALTER TABLE `tenants` MODIFY `plan_id` ENUM('free', 'hobby', 'starter', 'starter_plus', 'pro', 'pro_plus', 'business', 'business_plus', 'agency', 'enterprise') NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE `invoices` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `status` ENUM('draft', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'paid',
    `description` VARCHAR(191) NULL,
    `plan_id` VARCHAR(191) NULL,
    `plan_name` VARCHAR(191) NULL,
    `invoice_number` VARCHAR(191) NOT NULL,
    `issued_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `due_date` DATETIME(3) NULL,
    `paid_at` DATETIME(3) NULL,
    `download_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoices_invoice_number_key`(`invoice_number`),
    INDEX `invoices_user_id_idx`(`user_id`),
    INDEX `invoices_status_idx`(`status`),
    INDEX `invoices_issued_at_idx`(`issued_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_methods` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NOT NULL,
    `last4` VARCHAR(191) NOT NULL,
    `exp_month` INTEGER NOT NULL,
    `exp_year` INTEGER NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payment_methods_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_methods` ADD CONSTRAINT `payment_methods_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
