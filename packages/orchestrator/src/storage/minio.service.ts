import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "minio";
import * as fs from "fs";
import * as path from "path";

export interface BucketUsage {
	totalObjects: number;
	totalSize: number;
	totalSizeFormatted: string;
}

@Injectable()
export class MinioService {
	private readonly logger = new Logger(MinioService.name);
	private client: Client;
	private isConnected = false;
	private readonly uploadsDir: string;

	constructor(private configService: ConfigService) {
		const endpointUrl = this.configService.get<string>(
			"MINIO_ENDPOINT",
			"http://minio:9000"
		);
		const url = new URL(endpointUrl);

		this.client = new Client({
			endPoint: url.hostname,
			port: parseInt(url.port) || 9000,
			useSSL: url.protocol === "https:",
			accessKey: this.configService.get<string>(
				"MINIO_ROOT_USER",
				"minioadmin"
			),
			secretKey: this.configService.get<string>(
				"MINIO_ROOT_PASSWORD",
				"minioadmin123"
			),
		});

		// Local uploads directory fallback
		this.uploadsDir = path.join(process.cwd(), "uploads", "avatars");
		this.ensureLocalUploadsDir();

		this.checkConnection();
	}

	private ensureLocalUploadsDir() {
		if (!fs.existsSync(this.uploadsDir)) {
			fs.mkdirSync(this.uploadsDir, { recursive: true });
			this.logger.log(`Created local uploads directory: ${this.uploadsDir}`);
		}
	}

	private async checkConnection() {
		try {
			await this.client.listBuckets();
			this.isConnected = true;
			this.logger.log("Connected to MinIO");

			// Ensure required buckets exist
			await this.ensureBucketsExist();
		} catch (error) {
			this.logger.warn(
				`MinIO connection failed: ${error}. Using local file storage fallback.`
			);
			this.isConnected = false;
		}
	}

	private async ensureBucketsExist() {
		const requiredBuckets = ["wp-uploads", "avatars"];

		for (const bucket of requiredBuckets) {
			try {
				const exists = await this.client.bucketExists(bucket);
				if (!exists) {
					await this.client.makeBucket(bucket, "us-east-1");
					this.logger.log(`Created bucket: ${bucket}`);

					// Set public read policy for public buckets
					if (bucket === "wp-uploads" || bucket === "avatars") {
						const policy = {
							Version: "2012-10-17",
							Statement: [
								{
									Effect: "Allow",
									Principal: { AWS: ["*"] },
									Action: ["s3:GetObject"],
									Resource: [`arn:aws:s3:::${bucket}/*`],
								},
							],
						};
						await this.client.setBucketPolicy(bucket, JSON.stringify(policy));
						this.logger.log(`Set public read policy for bucket: ${bucket}`);
					}
				}
			} catch (error) {
				this.logger.warn(`Failed to ensure bucket ${bucket} exists: ${error}`);
			}
		}
	}

	/**
	 * Upload user avatar - falls back to local storage if MinIO is unavailable
	 */
	async uploadAvatar(
		userId: string,
		buffer: Buffer,
		mimeType: string
	): Promise<string> {
		const extension = mimeType.split("/")[1] || "jpg";
		const objectName = `${userId}.${extension}`;

		// Try MinIO first
		if (this.isConnected) {
			try {
				// Delete existing avatar first
				await this.deleteAvatar(userId).catch(() => {});

				// Upload new avatar
				await this.client.putObject(
					"avatars",
					objectName,
					buffer,
					buffer.length,
					{
						"Content-Type": mimeType,
					}
				);

				this.logger.log(
					`Uploaded avatar to MinIO for user ${userId}: ${objectName}`
				);
				return this.getAvatarUrl(objectName);
			} catch (error) {
				this.logger.warn(
					`MinIO upload failed, falling back to local: ${error}`
				);
			}
		}

		// Fallback to local file storage
		try {
			// Delete existing local avatars for this user
			await this.deleteLocalAvatar(userId);

			// Save to local uploads directory
			const filePath = path.join(this.uploadsDir, objectName);
			fs.writeFileSync(filePath, buffer);

			this.logger.log(
				`Uploaded avatar to local storage for user ${userId}: ${objectName}`
			);
			return this.getAvatarUrl(objectName);
		} catch (error) {
			this.logger.error(`Failed to upload avatar locally: ${error}`);
			throw error;
		}
	}

	/**
	 * Delete user avatar from MinIO
	 */
	async deleteAvatar(userId: string): Promise<void> {
		if (!this.isConnected) {
			// Try local deletion
			await this.deleteLocalAvatar(userId);
			return;
		}

		try {
			// List objects with userId prefix and delete them
			const objectsList: string[] = [];
			const stream = this.client.listObjectsV2("avatars", userId, true);

			await new Promise<void>((resolve, reject) => {
				stream.on("data", (obj: { name?: string }) => {
					if (obj.name) objectsList.push(obj.name);
				});
				stream.on("error", reject);
				stream.on("end", resolve);
			});

			for (const obj of objectsList) {
				await this.client.removeObject("avatars", obj);
				this.logger.log(`Deleted avatar: ${obj}`);
			}
		} catch (error) {
			this.logger.warn(`Failed to delete avatar for ${userId}: ${error}`);
		}
	}

	/**
	 * Delete local avatar files for a user
	 */
	private async deleteLocalAvatar(userId: string): Promise<void> {
		try {
			const files = fs.readdirSync(this.uploadsDir);
			for (const file of files) {
				if (file.startsWith(userId)) {
					const filePath = path.join(this.uploadsDir, file);
					fs.unlinkSync(filePath);
					this.logger.log(`Deleted local avatar: ${file}`);
				}
			}
		} catch (error) {
			this.logger.warn(`Failed to delete local avatar for ${userId}: ${error}`);
		}
	}

	/**
	 * Get public URL for avatar (works with both MinIO and local storage)
	 */
	getAvatarUrl(objectName: string): string {
		if (this.isConnected) {
			const endpoint = this.configService.get<string>(
				"MINIO_PUBLIC_ENDPOINT",
				this.configService.get<string>(
					"MINIO_ENDPOINT",
					"http://localhost:9000"
				)
			);
			return `${endpoint}/avatars/${objectName}`;
		}

		// Local fallback - serve via API
		const apiUrl = this.configService.get<string>(
			"API_BASE_URL",
			"http://localhost:3001"
		);
		return `${apiUrl}/uploads/avatars/${objectName}`;
	}

	async getBucketUsage(
		bucketName: string,
		prefix?: string
	): Promise<BucketUsage> {
		if (!this.isConnected) {
			return { totalObjects: 0, totalSize: 0, totalSizeFormatted: "0 B" };
		}

		try {
			let totalObjects = 0;
			let totalSize = 0;

			const stream = this.client.listObjectsV2(bucketName, prefix, true);

			return new Promise((resolve) => {
				stream.on("data", (obj: { size?: number }) => {
					totalObjects++;
					totalSize += obj.size || 0;
				});

				stream.on("error", (err: Error) => {
					this.logger.error(`Failed to list objects in ${bucketName}: ${err}`);
					resolve({ totalObjects: 0, totalSize: 0, totalSizeFormatted: "0 B" });
				});

				stream.on("end", () => {
					resolve({
						totalObjects,
						totalSize,
						totalSizeFormatted: this.formatBytes(totalSize),
					});
				});
			});
		} catch (error) {
			this.logger.error(`Failed to get bucket usage: ${error}`);
			return { totalObjects: 0, totalSize: 0, totalSizeFormatted: "0 B" };
		}
	}

	async getTenantStorageUsage(tenantId: string): Promise<BucketUsage> {
		// WordPress uploads are stored in wp-uploads bucket with tenant subdirectory
		return this.getBucketUsage("wp-uploads", `${tenantId}/`);
	}

	private formatBytes(bytes: number): string {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB", "TB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}
}
