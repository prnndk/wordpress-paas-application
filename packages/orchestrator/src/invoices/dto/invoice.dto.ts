import { ApiProperty } from "@nestjs/swagger";

export class InvoiceDto {
	@ApiProperty({ description: "Invoice ID" })
	id!: string;

	@ApiProperty({ description: "Invoice number (e.g., INV-2025-001)" })
	invoiceNumber!: string;

	@ApiProperty({ description: "Amount in cents or base currency unit" })
	amount!: number;

	@ApiProperty({ description: "Currency code", example: "USD" })
	currency!: string;

	@ApiProperty({
		description: "Invoice status",
		enum: ["draft", "paid", "overdue", "cancelled"],
	})
	status!: string;

	@ApiProperty({ description: "Invoice description", required: false })
	description?: string;

	@ApiProperty({
		description: "Plan ID if this invoice is for a subscription",
		required: false,
	})
	planId?: string;

	@ApiProperty({ description: "Plan name", required: false })
	planName?: string;

	@ApiProperty({ description: "Invoice issue date" })
	issuedAt!: Date;

	@ApiProperty({ description: "Due date", required: false })
	dueDate?: Date;

	@ApiProperty({ description: "Paid date", required: false })
	paidAt?: Date;

	@ApiProperty({ description: "Download URL for invoice PDF", required: false })
	downloadUrl?: string;
}

export class CreateInvoiceDto {
	@ApiProperty({ description: "Amount" })
	amount!: number;

	@ApiProperty({ description: "Description" })
	description?: string;

	@ApiProperty({ description: "Plan ID", required: false })
	planId?: string;

	@ApiProperty({ description: "Plan name", required: false })
	planName?: string;
}
