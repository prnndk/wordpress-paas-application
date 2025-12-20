import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PaymentsService {
	private readonly logger = new Logger(PaymentsService.name);

	constructor(private readonly prisma: PrismaService) {}

	private isDbMissingError(err: any) {
		const msg = String(err?.message || "");
		return /does not exist|table .* does not exist|column .* does not exist/i.test(
			msg
		);
	}

	/**
	 * Get all payment methods for a user
	 */
	async findByUserId(userId: string): Promise<any[]> {
		try {
			return await (this.prisma as any).paymentMethod.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
			});
		} catch (err: any) {
			this.logger.warn(
				`findByUserId payment methods failed (missing table?): ${
					err?.message || err
				}`
			);
			if (this.isDbMissingError(err)) return [];
			throw err;
		}
	}

	/**
	 * Get default payment method for user
	 */
	async getDefault(userId: string): Promise<any | null> {
		try {
			return await (this.prisma as any).paymentMethod.findFirst({
				where: { userId, isDefault: true },
			});
		} catch (err: any) {
			this.logger.warn(
				`getDefault payment method failed (missing table?): ${
					err?.message || err
				}`
			);
			if (this.isDbMissingError(err)) return null;
			throw err;
		}
	}

	/**
	 * Add new payment method (mock - never stores real card data)
	 */
	async create(
		userId: string,
		brand: string,
		last4: string,
		expMonth: number,
		expYear: number,
		setAsDefault: boolean = false
	): Promise<any> {
		// If setting as default, unset all other defaults first

		if (setAsDefault) {
			try {
				await (this.prisma as any).paymentMethod.updateMany({
					where: { userId },
					data: { isDefault: false },
				});
			} catch (err: any) {
				this.logger.warn(
					`unset defaults failed (missing payment_methods table?): ${
						err?.message || err
					}`
				);
				if (this.isDbMissingError(err)) {
					// continue as we'll create a mock below
				} else throw err;
			}
		}

		try {
			const paymentMethod = await (this.prisma as any).paymentMethod.create({
				data: {
					userId,
					brand: brand.toLowerCase(),
					last4,
					expMonth,
					expYear,
					isDefault: setAsDefault,
				},
			});

			this.logger.log(
				`Created payment method ${paymentMethod.id} for user ${userId}`
			);
			return paymentMethod;
		} catch (err: any) {
			this.logger.warn(
				`create payment method failed (missing payment_methods table?): ${
					err?.message || err
				}`
			);
			if (this.isDbMissingError(err)) {
				// return a mock payment method object
				const mock = {
					id: `mock-${Date.now()}`,
					userId,
					brand: brand.toLowerCase(),
					last4,
					expMonth,
					expYear,
					isDefault: setAsDefault,
					createdAt: new Date(),
				};
				this.logger.log(
					`Created mock payment method ${mock.id} for user ${userId}`
				);
				return mock;
			}
			throw err;
		}
	}

	/**
	 * Delete payment method
	 */
	async delete(paymentMethodId: string, userId: string): Promise<void> {
		try {
			await (this.prisma as any).paymentMethod.deleteMany({
				where: { id: paymentMethodId, userId },
			});
			this.logger.log(`Deleted payment method ${paymentMethodId}`);
		} catch (err: any) {
			this.logger.warn(
				`delete payment method failed (missing table?): ${err?.message || err}`
			);
			if (this.isDbMissingError(err)) {
				this.logger.log(
					`Skipping delete because payment_methods table missing; id=${paymentMethodId}`
				);
				return;
			}
			throw err;
		}
	}

	/**
	 * Set payment method as default
	 */
	async setDefault(paymentMethodId: string, userId: string): Promise<any> {
		// Unset all defaults first

		await (this.prisma as any).paymentMethod.updateMany({
			where: { userId },
			data: { isDefault: false },
		});
		try {
			await (this.prisma as any).paymentMethod.updateMany({
				where: { userId },
				data: { isDefault: false },
			});
		} catch (err: any) {
			this.logger.warn(
				`unset defaults failed (missing payment_methods table?): ${
					err?.message || err
				}`
			);
			if (this.isDbMissingError(err)) {
				this.logger.log(
					`Skipping unset defaults because payment_methods table missing`
				);
			} else throw err;
		}

		try {
			const updated = await (this.prisma as any).paymentMethod.update({
				where: { id: paymentMethodId },
				data: { isDefault: true },
			});
			this.logger.log(`Set payment method ${paymentMethodId} as default`);
			return updated;
		} catch (err: any) {
			this.logger.warn(
				`setDefault failed (missing table?): ${err?.message || err}`
			);
			if (this.isDbMissingError(err)) {
				this.logger.log(
					`Skipping setDefault because payment_methods table missing`
				);
				return null;
			}
			throw err;
		}
	}
}
