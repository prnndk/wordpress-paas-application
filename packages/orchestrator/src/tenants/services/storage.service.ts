import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly basePath: string;

    constructor(private configService: ConfigService) {
        this.basePath = this.configService.get<string>(
            'STORAGE_PATH',
            path.join(process.cwd(), 'data', 'tenants')
        );
    }

    async createTenantDirectory(tenantId: string): Promise<string> {
        const tenantPath = path.join(this.basePath, tenantId);
        const wpContentPath = path.join(tenantPath, 'wp-content');

        try {
            // Create tenant directory
            await fs.mkdir(tenantPath, { recursive: true });
            this.logger.log(`Created tenant directory: ${tenantPath}`);

            // Create wp-content subdirectories
            const wpSubDirs = ['plugins', 'themes', 'uploads', 'upgrade'];
            for (const dir of wpSubDirs) {
                await fs.mkdir(path.join(wpContentPath, dir), { recursive: true });
            }
            this.logger.log(`Created wp-content structure for tenant: ${tenantId}`);

            // Set permissions (www-data user in container typically uses uid 33)
            await this.setPermissions(wpContentPath, 33, 33);

            return wpContentPath;
        } catch (error) {
            this.logger.error(`Failed to create tenant directory: ${tenantId}`, error);
            throw error;
        }
    }

    async deleteTenantDirectory(tenantId: string): Promise<void> {
        const tenantPath = path.join(this.basePath, tenantId);

        try {
            await fs.rm(tenantPath, { recursive: true, force: true });
            this.logger.log(`Deleted tenant directory: ${tenantPath}`);
        } catch (error) {
            this.logger.error(`Failed to delete tenant directory: ${tenantId}`, error);
            throw error;
        }
    }

    async getTenantStoragePath(tenantId: string): Promise<string> {
        // Always use forward slashes for Docker mount paths (Linux containers)
        return `${this.basePath}/${tenantId}/wp-content`.replace(/\\/g, '/');
    }

    async listTenantFiles(
        tenantId: string,
        subPath: string = ''
    ): Promise<Array<{ name: string; type: 'file' | 'directory'; size: number }>> {
        const fullPath = path.join(this.basePath, tenantId, 'wp-content', subPath);

        try {
            const entries = await fs.readdir(fullPath, { withFileTypes: true });
            const result = [];

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    result.push({ name: entry.name, type: 'directory' as const, size: 0 });
                } else {
                    const stats = await fs.stat(path.join(fullPath, entry.name));
                    result.push({ name: entry.name, type: 'file' as const, size: stats.size });
                }
            }

            return result;
        } catch (error) {
            this.logger.error(`Failed to list files for tenant: ${tenantId}`, error);
            throw error;
        }
    }

    async getStorageUsage(tenantId: string): Promise<{ bytes: number; files: number }> {
        const tenantPath = path.join(this.basePath, tenantId);
        let totalBytes = 0;
        let totalFiles = 0;

        const walkDir = async (dir: string): Promise<void> => {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const entryPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        await walkDir(entryPath);
                    } else {
                        const stats = await fs.stat(entryPath);
                        totalBytes += stats.size;
                        totalFiles++;
                    }
                }
            } catch {
                // Ignore permission errors
            }
        };

        await walkDir(tenantPath);

        return { bytes: totalBytes, files: totalFiles };
    }

    private async setPermissions(
        dirPath: string,
        uid: number,
        gid: number
    ): Promise<void> {
        try {
            // Change ownership recursively
            const setOwner = async (p: string): Promise<void> => {
                await fs.chown(p, uid, gid);
                const entries = await fs.readdir(p, { withFileTypes: true });
                for (const entry of entries) {
                    const entryPath = path.join(p, entry.name);
                    if (entry.isDirectory()) {
                        await setOwner(entryPath);
                    } else {
                        await fs.chown(entryPath, uid, gid);
                    }
                }
            };
            await setOwner(dirPath);
        } catch (error) {
            this.logger.warn(`Failed to set permissions for ${dirPath}`, error);
        }
    }
}
