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

@Injectable()
export class DatabaseService {
    private readonly logger = new Logger(DatabaseService.name);
    private pool: mysql.Pool;

    constructor(private configService: ConfigService) {
        this.pool = mysql.createPool({
            host: this.configService.get<string>('MYSQL_HOST', 'mysql-master'),
            port: this.configService.get<number>('MYSQL_PORT', 3306),
            user: this.configService.get<string>('MYSQL_USER', 'root'),
            password: this.configService.get<string>('MYSQL_PASSWORD', ''),
            database: this.configService.get<string>('MYSQL_DATABASE', 'wp_paas'),
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
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
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

    async saveTenant(tenant: {
        id: string;
        userId: string;
        name: string;
        subdomain: string;
        dbName: string;
        dbUser: string;
        dbPassword: string;
        status: string;
    }): Promise<void> {
        await this.pool.query(
            `INSERT INTO tenants (id, user_id, name, subdomain, db_name, db_user, db_password, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE name = ?, status = ?, updated_at = NOW()`,
            [
                tenant.id,
                tenant.userId,
                tenant.name,
                tenant.subdomain,
                tenant.dbName,
                tenant.dbUser,
                tenant.dbPassword,
                tenant.status,
                tenant.name,
                tenant.status,
            ]
        );
    }

    async getTenant(tenantId: string): Promise<{
        id: string;
        userId: string;
        name: string;
        subdomain: string;
        dbName: string;
        dbUser: string;
        dbPassword: string;
        status: string;
    } | null> {
        const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
            'SELECT * FROM tenants WHERE id = ?',
            [tenantId]
        );

        if (rows.length === 0) {
            return null;
        }

        const row = rows[0]!;
        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            subdomain: row.subdomain,
            dbName: row.db_name,
            dbUser: row.db_user,
            dbPassword: row.db_password,
            status: row.status,
        };
    }

    async getTenantsByUser(userId: string): Promise<Array<{
        id: string;
        name: string;
        subdomain: string;
        status: string;
        createdAt: Date;
    }>> {
        const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
            'SELECT id, name, subdomain, status, created_at FROM tenants WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            subdomain: row.subdomain,
            status: row.status,
            createdAt: row.created_at,
        }));
    }

    async updateTenantStatus(tenantId: string, status: string): Promise<void> {
        await this.pool.query(
            'UPDATE tenants SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, tenantId]
        );
    }

    async deleteTenant(tenantId: string): Promise<void> {
        await this.pool.query('DELETE FROM tenants WHERE id = ?', [tenantId]);
    }

    async initializeSchema(): Promise<void> {
        const connection = await this.pool.getConnection();

        try {
            await connection.query(`
        CREATE TABLE IF NOT EXISTS tenants (
          id VARCHAR(32) PRIMARY KEY,
          user_id VARCHAR(32) NOT NULL,
          name VARCHAR(255) NOT NULL,
          subdomain VARCHAR(63) NOT NULL UNIQUE,
          db_name VARCHAR(64) NOT NULL,
          db_user VARCHAR(32) NOT NULL,
          db_password VARCHAR(128) NOT NULL,
          status ENUM('creating', 'running', 'stopped', 'error', 'deleted') DEFAULT 'creating',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_subdomain (subdomain),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

            await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(32) PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

            this.logger.log('Database schema initialized');
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
