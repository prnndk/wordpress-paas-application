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
	refreshToken: string;
	expiresIn: number; // Access token expiry in seconds
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
		name?: string,
		fullName?: string
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
			name: name || fullName || null,
			fullName: fullName || name || null,
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

		// Update last login timestamp
		await this.userRepository.update(user.id, { lastLoginAt: new Date() });

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
	 * Update user profile (name, fullName, avatarUrl)
	 */
	async updateProfile(
		userId: string,
		data: { fullName?: string; name?: string; avatarUrl?: string }
	): Promise<{ success: boolean }> {
		await this.userRepository.update(userId, data);
		return { success: true };
	}

	/**
	 * Update user settings (timezone, language)
	 */
	async updateSettings(
		userId: string,
		data: { timezone?: string; language?: string }
	): Promise<{ success: boolean }> {
		await this.userRepository.update(userId, data);
		return { success: true };
	}

	/**
	 * Change user password
	 */
	async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string
	): Promise<{ success: boolean }> {
		const user = await this.userRepository.findById(userId);

		if (!user) {
			throw new UnauthorizedException("User not found");
		}

		const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

		if (!isValid) {
			throw new UnauthorizedException("Current password is incorrect");
		}

		const passwordHash = await bcrypt.hash(newPassword, 12);
		await this.userRepository.update(userId, { passwordHash });

		return { success: true };
	}

	/**
	 * Delete user account permanently
	 * Requires password verification for security
	 */
	async deleteAccount(
		userId: string,
		password: string
	): Promise<{ success: boolean }> {
		const user = await this.userRepository.findById(userId);

		if (!user) {
			throw new UnauthorizedException("User not found");
		}

		const isValid = await bcrypt.compare(password, user.passwordHash);

		if (!isValid) {
			throw new UnauthorizedException("Password is incorrect");
		}

		// Delete user (cascade will delete related tenants due to schema)
		await this.userRepository.delete(userId);

		return { success: true };
	}

	/**
	 * Get full user profile with optional aggregated data
	 */
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

		// Build base response
		const response: MeResponseDto = {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				fullName: user.fullName || undefined,
				avatarUrl: user.avatarUrl || undefined,
				timezone: user.timezone || "UTC",
				language: user.language || "en",
				roles: [user.role], // Use actual role from DB
				createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
				lastLoginAt: user.lastLoginAt?.toISOString() || undefined,
			},
		};

		const tasks: Promise<void>[] = [];

		// Fetch tenants if requested
		if (includes.has("tenants")) {
			tasks.push(
				(async () => {
					try {
						// Always fetch only user's own tenants
						// Admin can use /admin/tenants endpoint for all tenants
						const tenantDetails = await this.tenantsService.getTenantsByUser(
							userId
						);

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
				})()
			);
		}

		// Fetch subscription if requested
		if (includes.has("subscriptions")) {
			tasks.push(
				(async () => {
					try {
						const currentSub =
							await this.subscriptionsService.getUserSubscription(userId);
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
				})()
			);
		}

		// Fetch cluster health if requested
		if (includes.has("cluster")) {
			tasks.push(
				(async () => {
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
				})()
			);
		}

		// Fetch audit summary if requested
		if (includes.has("audit")) {
			tasks.push(
				(async () => {
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
				})()
			);
		}

		// Wait for all async tasks to complete
		await Promise.all(tasks);

		// Fetch billing if requested (sync mock)
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
		const accessTokenExpiresIn = 15 * 60; // 15 minutes in seconds
		const refreshTokenExpiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

		const accessToken = this.jwtService.sign(payload, {
			expiresIn: accessTokenExpiresIn,
		});

		const refreshToken = this.jwtService.sign(
			{ ...payload, type: "refresh" },
			{ expiresIn: refreshTokenExpiresIn }
		);

		return { accessToken, refreshToken, expiresIn: accessTokenExpiresIn };
	}

	/**
	 * Refresh access token using a valid refresh token
	 */
	async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
		try {
			// Verify the refresh token
			const payload = this.jwtService.verify(refreshToken);

			// Ensure it's a refresh token, not an access token
			if (payload.type !== "refresh") {
				throw new UnauthorizedException("Invalid token type");
			}

			// Verify user still exists
			const user = await this.userRepository.findById(payload.id);
			if (!user) {
				throw new UnauthorizedException("User not found");
			}

			// Generate new tokens
			return this.generateTokens({
				id: user.id,
				email: user.email,
				roles: [user.role],
			});
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			// JWT verification failed (expired, invalid, etc.)
			throw new UnauthorizedException("Invalid or expired refresh token");
		}
	}
}
