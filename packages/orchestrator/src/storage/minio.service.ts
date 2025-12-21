import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

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

    constructor(private configService: ConfigService) {
        const endpointUrl = this.configService.get<string>('MINIO_ENDPOINT', 'http://minio:9000');
        const url = new URL(endpointUrl);

        this.client = new Client({
            endPoint: url.hostname,
            port: parseInt(url.port) || 9000,
            useSSL: url.protocol === 'https:',
            accessKey: this.configService.get<string>('MINIO_ROOT_USER', 'minioadmin'),
            secretKey: this.configService.get<string>('MINIO_ROOT_PASSWORD', 'minioadmin123'),
        });

        this.checkConnection();
    }

    private async checkConnection() {
        try {
            await this.client.listBuckets();
            this.isConnected = true;
            this.logger.log('Connected to MinIO');
        } catch (error) {
            this.logger.warn(`MinIO connection failed: ${error}`);
            this.isConnected = false;
        }
    }

    async getBucketUsage(bucketName: string, prefix?: string): Promise<BucketUsage> {
        if (!this.isConnected) {
            return { totalObjects: 0, totalSize: 0, totalSizeFormatted: '0 B' };
        }

        try {
            let totalObjects = 0;
            let totalSize = 0;

            const stream = this.client.listObjectsV2(bucketName, prefix, true);

            return new Promise((resolve) => {
                stream.on('data', (obj: { size?: number }) => {
                    totalObjects++;
                    totalSize += obj.size || 0;
                });

                stream.on('error', (err: Error) => {
                    this.logger.error(`Failed to list objects in ${bucketName}: ${err}`);
                    resolve({ totalObjects: 0, totalSize: 0, totalSizeFormatted: '0 B' });
                });

                stream.on('end', () => {
                    resolve({
                        totalObjects,
                        totalSize,
                        totalSizeFormatted: this.formatBytes(totalSize),
                    });
                });
            });
        } catch (error) {
            this.logger.error(`Failed to get bucket usage: ${error}`);
            return { totalObjects: 0, totalSize: 0, totalSizeFormatted: '0 B' };
        }
    }

    async getTenantStorageUsage(tenantId: string): Promise<BucketUsage> {
        // WordPress uploads are stored in wp-uploads bucket with tenant subdirectory
        return this.getBucketUsage('wp-uploads', `${tenantId}/`);
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
