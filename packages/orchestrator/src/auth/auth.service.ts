import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as mysql from 'mysql2/promise';
import { nanoid } from 'nanoid';

export interface UserPayload {
    id: string;
    email: string;
}

export interface AuthTokens {
    accessToken: string;
    expiresIn: number;
}

@Injectable()
export class AuthService {
    private pool: mysql.Pool;

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService
    ) {
        this.pool = mysql.createPool({
            host: this.configService.get<string>('MYSQL_HOST', 'mysql-master'),
            port: this.configService.get<number>('MYSQL_PORT', 3306),
            user: this.configService.get<string>('MYSQL_USER', 'root'),
            password: this.configService.get<string>('MYSQL_PASSWORD', ''),
            database: this.configService.get<string>('MYSQL_DATABASE', 'wp_paas'),
            waitForConnections: true,
            connectionLimit: 5,
        });
    }

    async register(
        email: string,
        password: string,
        name?: string
    ): Promise<AuthTokens> {
        // Check if user exists
        const [existing] = await this.pool.query<mysql.RowDataPacket[]>(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            throw new ConflictException('Email already registered');
        }

        // Hash password and create user
        const passwordHash = await bcrypt.hash(password, 12);
        const userId = nanoid(16);

        await this.pool.query(
            'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
            [userId, email, passwordHash, name || null]
        );

        return this.generateTokens({ id: userId, email });
    }

    async login(email: string, password: string): Promise<AuthTokens> {
        const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
            'SELECT id, email, password_hash FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const user = rows[0]!;
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateTokens({ id: user.id, email: user.email });
    }

    async validateUser(payload: UserPayload): Promise<UserPayload | null> {
        const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
            'SELECT id, email FROM users WHERE id = ?',
            [payload.id]
        );

        if (rows.length === 0) {
            return null;
        }

        const user = rows[0]!;
        return { id: user.id, email: user.email };
    }

    async getUser(userId: string): Promise<{ id: string; email: string; name: string | null } | null> {
        const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
            'SELECT id, email, name FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return null;
        }

        const user = rows[0]!;
        return { id: user.id, email: user.email, name: user.name };
    }

    private generateTokens(payload: UserPayload): AuthTokens {
        const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
        const accessToken = this.jwtService.sign(payload);

        return { accessToken, expiresIn };
    }
}
