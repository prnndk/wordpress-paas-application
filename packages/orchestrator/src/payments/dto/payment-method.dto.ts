import { ApiProperty } from "@nestjs/swagger";

export class PaymentMethodDto {
	@ApiProperty({ description: "Payment method ID" })
	id!: string;

	@ApiProperty({ description: "Card brand", example: "visa" })
	brand!: string;

	@ApiProperty({ description: "Last 4 digits", example: "4242" })
	last4!: string;

	@ApiProperty({ description: "Expiration month (1-12)" })
	expMonth!: number;

	@ApiProperty({ description: "Expiration year" })
	expYear!: number;

	@ApiProperty({ description: "Is default payment method" })
	isDefault!: boolean;

	@ApiProperty({ description: "Created date" })
	createdAt!: Date;
}

export class CreatePaymentMethodDto {
	@ApiProperty({
		description: "Mock payment token",
		example: "tok_mock_visa_4242",
	})
	token!: string;

	@ApiProperty({ description: "Card brand", example: "visa" })
	brand!: string;

	@ApiProperty({ description: "Last 4 digits", example: "4242" })
	last4!: string;

	@ApiProperty({ description: "Expiration month (1-12)" })
	expMonth!: number;

	@ApiProperty({ description: "Expiration year", example: 2025 })
	expYear!: number;

	@ApiProperty({ description: "Set as default", required: false })
	setAsDefault?: boolean;
}
