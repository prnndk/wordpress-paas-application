import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
    private readonly logger = new Logger(SchedulerService.name);
    private intervalId: NodeJS.Timeout | null = null;

    constructor(
        private readonly maintenanceService: MaintenanceService,
        private readonly prisma: PrismaService,
    ) { }

    onModuleInit() {
        this.logger.log('Starting maintenance scheduler...');
        this.startScheduler();
    }

    private startScheduler() {
        // Check every minute for due maintenance tasks
        this.intervalId = setInterval(async () => {
            await this.checkAndExecuteDueTasks();
        }, 60000); // 60 seconds

        // Also check immediately on startup
        this.checkAndExecuteDueTasks();
    }

    private async checkAndExecuteDueTasks() {
        try {
            const now = new Date();

            // Find all pending tasks that are due
            const dueTasks = await this.prisma.scheduledMaintenance.findMany({
                where: {
                    status: 'pending',
                    scheduledAt: {
                        lte: now,
                    },
                },
                orderBy: {
                    scheduledAt: 'asc',
                },
            });

            if (dueTasks.length === 0) {
                return;
            }

            this.logger.log(`Found ${dueTasks.length} due maintenance task(s)`);

            // Execute tasks one at a time
            for (const task of dueTasks) {
                try {
                    this.logger.log(`Executing scheduled maintenance ${task.id} (scheduled for ${task.scheduledAt})`);
                    await this.maintenanceService.executeScheduledMaintenance(task.id);
                    this.logger.log(`Successfully completed scheduled maintenance ${task.id}`);
                } catch (error) {
                    this.logger.error(`Failed to execute scheduled maintenance ${task.id}:`, error);
                    // Continue with next task even if this one failed
                }
            }
        } catch (error) {
            this.logger.error('Error checking for due maintenance tasks:', error);
        }
    }

    onModuleDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.logger.log('Maintenance scheduler stopped');
        }
    }
}
