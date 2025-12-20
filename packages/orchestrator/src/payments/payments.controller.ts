import {
	Controller,
	Get,
	Post,
	Delete,
	Patch,
	Param,
	Body,
	UseGuards,
	Req,
	HttpCode,
	HttpStatus,
	HttpException,
} from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
} from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { PaymentMethodDto } from "./dto/payment-method.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

interface AuthenticatedRequest extends Request {
	user: { id: string; email: string };
}

@ApiTags("payments")
@Controller("payment-methods")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
	constructor(private readonly paymentsService: PaymentsService) {}

	@Get()
	@ApiOperation({ summary: "Get user payment methods" })
	@ApiResponse({
		status: 200,
		description: "List of payment methods",
		type: [PaymentMethodDto],
	})
	async getPaymentMethods(
		@Req() req: AuthenticatedRequest
	): Promise<PaymentMethodDto[]> {
		const userId = req.user.id;
		const methods = await this.paymentsService.findByUserId(userId);
		return methods.map((pm) => ({
			id: pm.id,
			brand: pm.brand,
			last4: pm.last4,
			expMonth: pm.expMonth,
			expYear: pm.expYear,
			isDefault: pm.isDefault,
			createdAt: pm.createdAt,
		}));
	}

	@Post()
	@ApiOperation({ summary: "Add payment method (mock)" })
	@ApiResponse({
		status: 201,
		description: "Payment method added",
		type: PaymentMethodDto,
	})
	async addPaymentMethod(
		@Req() req: AuthenticatedRequest,
		@Body() body: any
	): Promise<PaymentMethodDto> {
		const userId = req.user.id;
		const brand = body?.brand?.toLowerCase?.() || "unknown";
		const last4 = body?.last4 || String(Date.now()).slice(-4);
		const expMonth = Number(body?.expMonth) || 1;
		const expYear = Number(body?.expYear) || new Date().getFullYear() + 1;
		const setAsDefault = Boolean(body?.setAsDefault);

		const method = await this.paymentsService.create(
			userId,
			brand,
			last4,
			expMonth,
			expYear,
			setAsDefault
		);

		return {
			id: method.id,
			brand: method.brand,
			last4: method.last4,
			expMonth: method.expMonth,
			expYear: method.expYear,
			isDefault: method.isDefault,
			createdAt: method.createdAt,
		};
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: "Delete payment method" })
	@ApiResponse({ status: 204, description: "Payment method deleted" })
	async deletePaymentMethod(
		@Req() req: AuthenticatedRequest,
		@Param("id") paymentMethodId: string
	): Promise<void> {
		const userId = req.user.id;
		await this.paymentsService.delete(paymentMethodId, userId);
	}

	@Patch(":id/default")
	@ApiOperation({ summary: "Set payment method as default" })
	@ApiResponse({
		status: 200,
		description: "Payment method set as default",
		type: PaymentMethodDto,
	})
	async setDefaultPaymentMethod(
		@Req() req: AuthenticatedRequest,
		@Param("id") paymentMethodId: string
	): Promise<PaymentMethodDto> {
		const userId = req.user.id;
		const updated = await this.paymentsService.setDefault(
			paymentMethodId,
			userId
		);

		if (!updated) {
			throw new HttpException("Payment method not found", HttpStatus.NOT_FOUND);
		}

		return {
			id: updated.id,
			brand: updated.brand,
			last4: updated.last4,
			expMonth: updated.expMonth,
			expYear: updated.expYear,
			isDefault: updated.isDefault,
			createdAt: updated.createdAt,
		};
	}
}
