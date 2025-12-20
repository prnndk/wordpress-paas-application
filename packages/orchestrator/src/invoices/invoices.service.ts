import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InvoicesService {
	private readonly logger = new Logger(InvoicesService.name);

	constructor(private readonly prisma: PrismaService) {}

	private isDbMissingError(err: any) {
		const msg = String(err?.message || "");
		return /does not exist|column .* does not exist|table .* does not exist/i.test(
			msg
		);
	}

	/**
	 * Get all invoices for a user
	 */
	async findByUserId(userId: string): Promise<any[]> {
		try {
			return await (this.prisma as any).invoice.findMany({
				where: { userId },
				orderBy: { issuedAt: "desc" },
			});
		} catch (err: any) {
			this.logger.warn(
				`findByUserId invoices failed (missing invoices table?): ${
					err?.message || err
				}`
			);
			if (this.isDbMissingError(err)) return [];
			throw err;
		}
	}

	/**
	 * Get invoice by ID (with user validation)
	 */
	async findByIdAndUser(invoiceId: string, userId: string): Promise<any> {
		try {
			const invoice = await (this.prisma as any).invoice.findFirst({
				where: { id: invoiceId, userId },
			});

			if (!invoice) {
				throw new NotFoundException(`Invoice ${invoiceId} not found`);
			}

			return invoice;
		} catch (err: any) {
			this.logger.warn(`findByIdAndUser failed: ${err?.message || err}`);
			if (this.isDbMissingError(err))
				throw new NotFoundException(`Invoice ${invoiceId} not found`);
			throw err;
		}
	}

	/**
	 * Create mock invoice (usually called after successful checkout)
	 */
	async createInvoice(
		userId: string,
		amount: number,
		planId?: string,
		planName?: string,
		description?: string
	): Promise<any> {
		const invoiceNumber = await this.generateInvoiceNumber();

		try {
			const invoice = await (this.prisma as any).invoice.create({
				data: {
					userId,
					amount,
					currency: "USD",
					status: "paid",
					description:
						description || `Payment for ${planName || "subscription"}`,
					planId,
					planName,
					invoiceNumber,
					issuedAt: new Date(),
					paidAt: new Date(), // Mock: immediately paid
					downloadUrl: `/api/v1/invoices/${invoiceNumber}/download`,
				},
			});

			this.logger.log(`Created invoice ${invoiceNumber} for user ${userId}`);
			return invoice;
		} catch (err: any) {
			this.logger.warn(
				`createInvoice failed (invoices table missing?): ${err?.message || err}`
			);
			if (this.isDbMissingError(err)) {
				// Return a mock invoice object when DB not migrated
				const mock = {
					id: `mock-${invoiceNumber}`,
					userId,
					amount,
					currency: "USD",
					status: "paid",
					description:
						description || `Payment for ${planName || "subscription"}`,
					planId,
					planName,
					invoiceNumber,
					issuedAt: new Date(),
					paidAt: new Date(),
					downloadUrl: `/api/v1/invoices/${invoiceNumber}/download`,
				};
				this.logger.log(
					`Created mock invoice ${invoiceNumber} for user ${userId}`
				);
				return mock;
			}
			throw err;
		}
	}

	/**
	 * Generate mock invoice number
	 */
	private async generateInvoiceNumber(): Promise<string> {
		const year = new Date().getFullYear();
		const month = String(new Date().getMonth() + 1).padStart(2, "0");

		// Get count of invoices this month
		const startOfMonth = new Date(year, new Date().getMonth(), 1);
		let count = 0;
		try {
			count = await (this.prisma as any).invoice.count({
				where: { issuedAt: { gte: startOfMonth } },
			});
		} catch (err: any) {
			this.logger.warn(
				`count invoices failed (invoices table missing?): ${
					err?.message || err
				}`
			);
			if (this.isDbMissingError(err)) {
				count = 0;
			} else {
				throw err;
			}
		}

		const sequence = String(
			(typeof count === "number" ? count : 0) + 1
		).padStart(4, "0");
		return `INV-${year}${month}-${sequence}`;
	}

	/**
	 * Generate mock invoice PDF/text content
	 */
	async generateInvoiceDocument(invoice: any): Promise<string> {
		// Mock invoice as plain text (in production, generate actual PDF)
		const content = `
========================================
		  INVOICE ${invoice.invoiceNumber}
========================================

Issue Date: ${invoice.issuedAt.toLocaleDateString()}
Due Date: ${invoice.dueDate?.toLocaleDateString() || "N/A"}
Status: ${invoice.status.toUpperCase()}

----------------------------------------

Description: ${invoice.description || "Subscription Payment"}
Plan: ${invoice.planName || "N/A"}

Amount: $${(invoice.amount / 100).toFixed(2)} ${invoice.currency}

----------------------------------------

${
	invoice.paidAt
		? `Paid on: ${invoice.paidAt.toLocaleDateString()}`
		: "Payment Pending"
}

Thank you for your business!

========================================
		`.trim();

		return content;
	}
}
