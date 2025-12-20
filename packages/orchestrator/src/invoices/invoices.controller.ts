import {
	Controller,
	Get,
	Param,
	UseGuards,
	Res,
	Req,
	NotFoundException,
} from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
} from "@nestjs/swagger";
import { InvoicesService } from "./invoices.service";
import { InvoiceDto } from "./dto/invoice.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { Response, Request } from "express";

interface AuthenticatedRequest extends Request {
	user: { id: string; email: string };
}

@ApiTags("invoices")
@Controller("invoices")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
	constructor(private readonly invoicesService: InvoicesService) {}

	@Get()
	@ApiOperation({ summary: "Get user invoices" })
	@ApiResponse({
		status: 200,
		description: "List of invoices",
		type: [InvoiceDto],
	})
	async getInvoices(@Req() req: AuthenticatedRequest): Promise<InvoiceDto[]> {
		const userId = req.user.id;
		const invoices = await this.invoicesService.findByUserId(userId);
		return invoices.map((inv) => ({
			id: inv.id,
			invoiceNumber: inv.invoiceNumber,
			amount: inv.amount,
			currency: inv.currency,
			status: inv.status,
			description: inv.description || undefined,
			planId: inv.planId || undefined,
			planName: inv.planName || undefined,
			issuedAt: inv.issuedAt,
			dueDate: inv.dueDate || undefined,
			paidAt: inv.paidAt || undefined,
			downloadUrl: `/api/v1/invoices/${inv.id}/download`,
		}));
	}

	@Get(":id/download")
	@ApiOperation({ summary: "Download invoice as text/PDF" })
	@ApiResponse({ status: 200, description: "Invoice document" })
	@ApiResponse({ status: 404, description: "Invoice not found" })
	async downloadInvoice(
		@Param("id") invoiceId: string,
		@Req() req: AuthenticatedRequest,
		@Res() res: Response
	): Promise<void> {
		const userId = req.user.id;
		const invoice = await this.invoicesService.findByIdAndUser(
			invoiceId,
			userId
		);

		if (!invoice) {
			throw new NotFoundException("Invoice not found");
		}

		const content = await this.invoicesService.generateInvoiceDocument(invoice);

		// Set headers for text download (in production use PDF)
		res.setHeader("Content-Type", "text/plain");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="invoice_${invoice.invoiceNumber}.txt"`
		);
		res.send(content);
	}
}
