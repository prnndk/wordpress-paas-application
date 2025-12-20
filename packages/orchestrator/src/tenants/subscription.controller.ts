import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn } from 'class-validator';
import { SubscriptionService, PricingPlan, SubscriptionDetails } from './services/subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanTier } from '@prisma/client';

class UpgradePlanDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['free', 'starter', 'professional', 'enterprise'])
    planId!: PlanTier;

    @IsNumber()
    @IsOptional()
    durationMonths?: number;
}

interface AuthenticatedRequest extends Request {
    user: { id: string; email: string };
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) { }

    @Get('plans')
    @ApiOperation({ summary: 'Get all available pricing plans' })
    @ApiResponse({ status: 200, description: 'List of pricing plans' })
    getPlans(): PricingPlan[] {
        return this.subscriptionService.getPricingPlans();
    }

    @Get('plans/:id')
    @ApiOperation({ summary: 'Get a specific pricing plan' })
    @ApiParam({ name: 'id', description: 'Plan ID' })
    @ApiResponse({ status: 200, description: 'Plan details' })
    getPlan(@Param('id') id: PlanTier): PricingPlan | undefined {
        return this.subscriptionService.getPlanById(id);
    }

    @Get('current')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get current user subscription' })
    @ApiResponse({ status: 200, description: 'Current subscription' })
    async getCurrentSubscription(
        @Req() req: AuthenticatedRequest
    ): Promise<{ subscription: SubscriptionDetails | null; plan: PricingPlan }> {
        const subscription = await this.subscriptionService.getSubscription(req.user.id);
        const plan = await this.subscriptionService.getUserPlan(req.user.id);
        return { subscription, plan };
    }

    @Post('upgrade')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Upgrade subscription plan' })
    @ApiResponse({ status: 200, description: 'Subscription upgraded' })
    async upgradePlan(
        @Body() dto: UpgradePlanDto,
        @Req() req: AuthenticatedRequest
    ): Promise<SubscriptionDetails> {
        const currentPlan = await this.subscriptionService.getUserPlan(req.user.id);
        const newPlan = this.subscriptionService.getPlanById(dto.planId);

        if (!newPlan) {
            throw new BadRequestException('Invalid plan');
        }

        if (newPlan.price < currentPlan.price) {
            throw new BadRequestException('Use downgrade endpoint for lowering plan');
        }

        return this.subscriptionService.upgradePlan(
            req.user.id,
            dto.planId,
            dto.durationMonths || 1
        );
    }

    @Post('downgrade')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Downgrade subscription plan' })
    @ApiResponse({ status: 200, description: 'Subscription downgraded' })
    async downgradePlan(
        @Body() dto: UpgradePlanDto,
        @Req() req: AuthenticatedRequest
    ): Promise<SubscriptionDetails> {
        const currentPlan = await this.subscriptionService.getUserPlan(req.user.id);
        const newPlan = this.subscriptionService.getPlanById(dto.planId);

        if (!newPlan) {
            throw new BadRequestException('Invalid plan');
        }

        if (newPlan.price > currentPlan.price) {
            throw new BadRequestException('Use upgrade endpoint for higher plan');
        }

        return this.subscriptionService.downgradePlan(req.user.id, dto.planId);
    }

    @Post('cancel')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Cancel current subscription' })
    @ApiResponse({ status: 204, description: 'Subscription cancelled' })
    async cancelSubscription(@Req() req: AuthenticatedRequest): Promise<void> {
        const subscription = await this.subscriptionService.getSubscription(req.user.id);
        if (subscription) {
            await this.subscriptionService.cancelSubscription(subscription.id);
        }
    }
}
