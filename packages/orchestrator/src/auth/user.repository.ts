import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { User, Prisma } from "@prisma/client";

@Injectable()
export class UserRepository {
	constructor(private readonly prisma: PrismaService) {}

	async create(data: Prisma.UserCreateInput): Promise<User> {
		return this.prisma.user.create({ data });
	}

	async findById(id: string): Promise<User | null> {
		if (!id) return null;
		try {
			return await this.prisma.user.findUnique({
				where: { id },
			});
		} catch (error) {
			console.error(`Error in findById for id ${id}:`, error);
			// If connection is closed, we might want to throw or return null depending on resilience strategy
			// Here, returning null allows the auth guard to simply fail (Unauthorized) instead of crashing
			return null;
		}
	}

	async findByEmail(email: string): Promise<User | null> {
		if (!email) return null;
		try {
			return await this.prisma.user.findUnique({
				where: { email },
			});
		} catch (error) {
			console.error(`Error in findByEmail for email ${email}:`, error);
			return null;
		}
	}

	async findByIdWithRelations(id: string): Promise<User | null> {
		if (!id) return null;
		try {
			return await this.prisma.user.findUnique({
				where: { id },
				include: {
					tenants: true,
					subscriptions: {
						where: { status: "active" },
						orderBy: { createdAt: "desc" },
						take: 1,
					},
				},
			});
		} catch (error) {
			console.error(`Error in findByIdWithRelations for id ${id}:`, error);
			return null;
		}
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
