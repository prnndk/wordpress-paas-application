import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';

export interface TenantDatabase {
    name: string;
    user: string;
    password: string;
    host: string;
    port: number;
}

/**
 * TenantDatabaseService handles the creation and deletion of
 * tenant-specific MySQL databases (separate from the main app database).
 * This is NOT managed by Prisma as it creates external databases.
 */
@Injectable()
export class TenantDatabaseService {
    private readonly logger = new Logger(TenantDatabaseService.name);
    private pool: mysql.Pool;

    constructor(private configService: ConfigService) {
        this.pool = mysql.createPool({
            host: this.configService.get<string>('MYSQL_HOST', 'mysql-master'),
            port: this.configService.get<number>('MYSQL_PORT', 3306),
            user: this.configService.get<string>('MYSQL_USER', 'root'),
            password: this.configService.get<string>('MYSQL_PASSWORD', ''),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
    }

    async createTenantDatabase(tenantId: string): Promise<TenantDatabase> {
        const dbName = `wp_tenant_${tenantId}`;
        const dbUser = `user_${tenantId}`;
        const dbPassword = this.generatePassword();

        const connection = await this.pool.getConnection();

        try {
            // Create database
            await connection.query(
                `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
            );
            this.logger.log(`Database created: ${dbName}`);

            // Create user with privileges
            await connection.query(
                `CREATE USER IF NOT EXISTS '${dbUser}'@'%' IDENTIFIED BY '${dbPassword}'`
            );
            await connection.query(
                `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%'`
            );
            await connection.query('FLUSH PRIVILEGES');
            this.logger.log(`User created: ${dbUser}`);

            return {
                name: dbName,
                user: dbUser,
                password: dbPassword,
                host: this.configService.get<string>('MYSQL_HOST', 'mysql-master'),
                port: this.configService.get<number>('MYSQL_PORT', 3306),
            };
        } finally {
            connection.release();
        }
    }

    async deleteTenantDatabase(tenantId: string): Promise<void> {
        const dbName = `wp_tenant_${tenantId}`;
        const dbUser = `user_${tenantId}`;

        const connection = await this.pool.getConnection();

        try {
            await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
            this.logger.log(`Database deleted: ${dbName}`);

            await connection.query(`DROP USER IF EXISTS '${dbUser}'@'%'`);
            this.logger.log(`User deleted: ${dbUser}`);
        } finally {
            connection.release();
        }
    }

    private generatePassword(length: number = 24): string {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}
