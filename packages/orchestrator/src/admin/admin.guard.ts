import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user?.id) {
            throw new ForbiddenException('User not authenticated');
        }

        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true, isActive: true },
        });

        if (!dbUser) {
            throw new ForbiddenException('User not found');
        }

        if (!dbUser.isActive) {
            throw new ForbiddenException('User account is disabled');
        }

        if (dbUser.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}
