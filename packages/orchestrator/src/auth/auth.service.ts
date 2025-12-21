import {
	Injectable,
	UnauthorizedException,
	ConflictException,
	Inject,
	forwardRef,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UserRepository } from "./user.repository";
import { TenantsService } from "../tenants/services/tenants.service";
import { ClusterService } from "../cluster/cluster.service";
import { AuditService } from "../audit/audit.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { MeResponseDto, IncludeOption } from "./dto/me-response.dto";

export interface UserPayload {
	id: string;
	email: string;
	roles: string[];
}

export interface AuthTokens {
	accessToken: string;
	expiresIn: number;
}

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly userRepository: UserRepository,
		@Inject(forwardRef(() => TenantsService))
		private readonly tenantsService: TenantsService,
		private readonly clusterService: ClusterService,
		private readonly auditService: AuditService,
		private readonly subscriptionsService: SubscriptionsService
	) {}

	async register(
		email: string,
		password: string,
		name?: string
	): Promise<AuthTokens> {
		// Check if user exists
		const existingUser = await this.userRepository.findByEmail(email);

		if (existingUser) {
			throw new ConflictException("Email already registered");
		}

		// Hash password and create user
		const passwordHash = await bcrypt.hash(password, 12);

		const user = await this.userRepository.create({
			email,
			passwordHash,
			name: name || null,
		});

		// Default role is 'user'
		return this.generateTokens({
			id: user.id,
			email: user.email,
			roles: ["user"],
		});
	}

	async login(email: string, password: string): Promise<AuthTokens> {
		const user = await this.userRepository.findByEmail(email);

		if (!user) {
			throw new UnauthorizedException("Invalid credentials");
		}

		const isValid = await bcrypt.compare(password, user.passwordHash);

		if (!isValid) {
			throw new UnauthorizedException("Invalid credentials");
		}

		return this.generateTokens({
			id: user.id,
			email: user.email,
			roles: [user.role],
		});
	}

	async validateUser(payload: UserPayload): Promise<UserPayload | null> {
		const user = await this.userRepository.findById(payload.id);

		if (!user) {
			return null;
		}

		return { id: user.id, email: user.email, roles: [user.role] };
	}

	async getUser(
		userId: string
	): Promise<{ id: string; email: string; name: string | null } | null> {
		const user = await this.userRepository.findById(userId);

		if (!user) {
			return null;
		}

		return { id: user.id, email: user.email, name: user.name };
	}

	/**
	 * Get full user profile with optional aggregated data
	 */
	async getFullUserProfile(
		userId: string,
		includes: Set<IncludeOption>
	): Promise<MeResponseDto> {
		const user = await this.userRepository.findById(userId);

		if (!user) {
			throw new UnauthorizedException("User not found");
		}

		// Build response
		const response: MeResponseDto = {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				roles: [user.role], // Use actual role from DB
				createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
			},
		};

		// Fetch tenants if requested
		if (includes.has("tenants")) {
			try {
				let tenantDetails;
				if (user.role === "admin") {
					tenantDetails = await this.tenantsService.getAllTenants();
				} else {
					tenantDetails = await this.tenantsService.getTenantsByUser(userId);
				}

				// Convert to TenantSummaryDto (limit to 10)
				response.tenants = tenantDetails.slice(0, 10).map((t) => ({
					id: t.id,
					name: t.name,
					slug: t.slug,
					status: t.status,
					specs: {
						cpuCores: t.specs?.cpuCores || 1,
						ramGb: t.specs?.ramGb || 2,
						diskGb: t.specs?.storageGb || 10,
					},
					planId: t.planId,
					createdAt: t.createdAt?.toISOString() || new Date().toISOString(),
					endpoints: t.endpoints || {
						admin: "#",
						site: "#",
					},
				}));
			} catch (error) {
				response.tenants = [];
			}
		}

		// Fetch subscription if requested
		if (includes.has("subscriptions")) {
			try {
				const currentSub = await this.subscriptionsService.getUserSubscription(
					userId
				);
				const plans = this.subscriptionsService.getAvailablePlans();

				if (currentSub) {
					response.subscriptions = {
						current: {
							id: currentSub.id,
							planId: currentSub.planId,
							planName: currentSub.planName,
							price: currentSub.price,
							currency: currentSub.currency,
							startedAt: currentSub.startedAt,
							expiresAt: currentSub.expiresAt,
							status: currentSub.status,
							limits: currentSub.limits,
						},
						availablePlans: plans.map((p) => ({
							id: p.id,
							name: p.name,
							price: p.price,
							features: p.features,
						})),
					};
				}
			} catch (error) {
				// Skip subscriptions on error
			}
		}

		// Fetch cluster health if requested
		if (includes.has("cluster")) {
			try {
				const clusterHealth = await this.clusterService.getClusterHealth();

				response.cluster = {
					swarmStatus: clusterHealth.swarmStatus,
					totalNodes: clusterHealth.totalNodes,
					onlineNodes: clusterHealth.totalNodes, // Assume all online for now
					totalCpuCores: clusterHealth.totalCpuCores,
					totalRamGb: clusterHealth.totalRamGb,
					runningServices: clusterHealth.runningServices,
					metricsUpdatedAt: new Date().toISOString(),
				};
			} catch (error) {
				response.cluster = {
					swarmStatus: "unknown",
					totalNodes: 0,
				};
			}
		}

		// Fetch audit summary if requested
		if (includes.has("audit")) {
			try {
				const auditLogs = await this.auditService.getAuditLogs({
					userId,
					limit: 10,
				});

				// Count by level
				const counts = { info: 0, warn: 0, error: 0 };
				auditLogs.forEach((log) => {
					if (log.level === "info") counts.info++;
					else if (log.level === "warn") counts.warn++;
					else if (log.level === "error") counts.error++;
				});

				response.auditSummary = {
					recent: auditLogs.map((log) => ({
						id: log.id,
						timestamp: log.timestamp,
						level: log.level,
						source: log.source,
						message: log.message,
						tenantId: log.tenantId,
					})),
					counts,
				};
			} catch (error) {
				response.auditSummary = {
					recent: [],
					counts: { info: 0, warn: 0, error: 0 },
				};
			}
		}

		// Fetch billing if requested
		if (includes.has("billing")) {
			// Mock billing info for now until calculateBilling is implemented
			response.billing = {
				monthlyEstimate: 0,
				currency: "USD",
				breakdown: [],
			};
		}

		return response;
	}

	private generateTokens(payload: UserPayload): AuthTokens {
		const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
		const accessToken = this.jwtService.sign(payload);

		return { accessToken, expiresIn };
	}
}
