-- MySQL Slave Replication Setup Script
-- Run on Slave after Master is initialized

-- Stop any existing replication
STOP SLAVE;
RESET SLAVE ALL;

-- Configure master connection using GTID
CHANGE MASTER TO
    MASTER_HOST='mysql-master',
    MASTER_USER='repl_user',
    MASTER_PASSWORD='${MYSQL_REPLICATION_PASSWORD}',
    MASTER_AUTO_POSITION=1,
    GET_MASTER_PUBLIC_KEY=1;

-- Start replication
START SLAVE;

-- Check replication status
SHOW SLAVE STATUS\G
