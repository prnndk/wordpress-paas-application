import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({ data });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findByIdWithRelations(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                tenants: true,
                subscriptions: {
                    where: { status: 'active' },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
    }

    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<User> {
        return this.prisma.user.delete({
            where: { id },
        });
    }

    async exists(email: string): Promise<boolean> {
        const count = await this.prisma.user.count({
            where: { email },
        });
        return count > 0;
    }
}
