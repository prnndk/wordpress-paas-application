import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from './user.repository';

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
    constructor(
        private readonly jwtService: JwtService,
        private readonly userRepository: UserRepository,
    ) { }

    async register(
        email: string,
        password: string,
        name?: string
    ): Promise<AuthTokens> {
        // Check if user exists
        const existingUser = await this.userRepository.findByEmail(email);

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Hash password and create user
        const passwordHash = await bcrypt.hash(password, 12);

        const user = await this.userRepository.create({
            email,
            passwordHash,
            name: name || null,
        });

        return this.generateTokens({ id: user.id, email: user.email });
    }

    async login(email: string, password: string): Promise<AuthTokens> {
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateTokens({ id: user.id, email: user.email });
    }

    async validateUser(payload: UserPayload): Promise<UserPayload | null> {
        const user = await this.userRepository.findById(payload.id);

        if (!user) {
            return null;
        }

        return { id: user.id, email: user.email };
    }

    async getUser(userId: string): Promise<{ id: string; email: string; name: string | null } | null> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            return null;
        }

        return { id: user.id, email: user.email, name: user.name };
    }

    private generateTokens(payload: UserPayload): AuthTokens {
        const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
        const accessToken = this.jwtService.sign(payload);

        return { accessToken, expiresIn };
    }
}
