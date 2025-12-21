-- AlterTable: Add subscription limits fields
ALTER TABLE `subscriptions` ADD COLUMN `max_instances` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `subscriptions` ADD COLUMN `max_cpu_cores` DOUBLE NOT NULL DEFAULT 1;
ALTER TABLE `subscriptions` ADD COLUMN `max_ram_gb` DOUBLE NOT NULL DEFAULT 0.5;
ALTER TABLE `subscriptions` ADD COLUMN `max_storage_gb` INTEGER NOT NULL DEFAULT 5;
ALTER TABLE `subscriptions` ADD COLUMN `max_bandwidth_gb` INTEGER NOT NULL DEFAULT 10;

-- Update existing subscriptions based on their plan tier
UPDATE `subscriptions` SET
  `max_instances` = CASE
    WHEN `plan_id` = 'free' THEN 1
    WHEN `plan_id` = 'starter' THEN 2
    WHEN `plan_id` = 'professional' THEN 5
    WHEN `plan_id` = 'enterprise' THEN 100
    ELSE 1
  END,
  `max_cpu_cores` = CASE
    WHEN `plan_id` = 'free' THEN 0.5
    WHEN `plan_id` = 'starter' THEN 1
    WHEN `plan_id` = 'professional' THEN 2
    WHEN `plan_id` = 'enterprise' THEN 8
    ELSE 0.5
  END,
  `max_ram_gb` = CASE
    WHEN `plan_id` = 'free' THEN 0.5
    WHEN `plan_id` = 'starter' THEN 1
    WHEN `plan_id` = 'professional' THEN 2
    WHEN `plan_id` = 'enterprise' THEN 16
    ELSE 0.5
  END,
  `max_storage_gb` = CASE
    WHEN `plan_id` = 'free' THEN 5
    WHEN `plan_id` = 'starter' THEN 10
    WHEN `plan_id` = 'professional' THEN 30
    WHEN `plan_id` = 'enterprise' THEN 1000
    ELSE 5
  END,
  `max_bandwidth_gb` = CASE
    WHEN `plan_id` = 'free' THEN 10
    WHEN `plan_id` = 'starter' THEN 50
    WHEN `plan_id` = 'professional' THEN 150
    WHEN `plan_id` = 'enterprise' THEN 5000
    ELSE 10
  END;
