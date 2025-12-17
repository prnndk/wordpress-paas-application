-- MySQL Replication Initialization Script
-- Run on Master to create replication user

-- Create the main application database
CREATE DATABASE IF NOT EXISTS wp_paas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create replication user
CREATE USER IF NOT EXISTS 'repl_user'@'%' IDENTIFIED WITH mysql_native_password BY '${MYSQL_REPLICATION_PASSWORD}';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'repl_user'@'%';

-- Create application user for the orchestrator
CREATE USER IF NOT EXISTS 'wp_paas_admin'@'%' IDENTIFIED WITH mysql_native_password BY '${MYSQL_APP_PASSWORD}';
GRANT ALL PRIVILEGES ON wp_paas.* TO 'wp_paas_admin'@'%';
GRANT CREATE, DROP, ALTER ON *.* TO 'wp_paas_admin'@'%';

-- Flush privileges
FLUSH PRIVILEGES;

-- Show master status for slave configuration
SHOW MASTER STATUS;
