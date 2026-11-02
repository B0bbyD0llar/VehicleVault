import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import { NotificationService } from './notificationService.js';
import { logger } from '../utils/logger.js';

export class SchedulerService {
  private static scheduler: ToadScheduler | null = null;
  private static isInitialized = false;

  public static initialize(): void {
    if (this.isInitialized) return;

    this.scheduler = new ToadScheduler();

    // 1. Daily Notification and Document / APK Expiration Alert Task
    const alertTask = new AsyncTask(
      'daily-vehicle-alerts',
      async () => {
        try {
          logger.info('Scheduler: Running automated vehicle alerts check...');
          const result = await NotificationService.checkAndDispatchAlerts();
          logger.info({ alertsSent: result.alertsSent }, 'Scheduler: Alerts check completed');
        } catch (err: any) {
          logger.error({ err: err?.message }, 'Scheduler: Error checking vehicle alerts');
        }
      },
      (err: Error) => {
        logger.error({ err: err.message }, 'Scheduler: Unhandled task error in vehicle alerts');
      }
    );

    // Run every 6 hours (and soon after boot via initial execution if needed)
    const alertJob = new SimpleIntervalJob({ hours: 6, runImmediately: false }, alertTask, {
      id: 'job-vehicle-alerts',
      preventOverrun: true,
    });

    this.scheduler.addSimpleIntervalJob(alertJob);
    this.isInitialized = true;
    logger.info('ToadScheduler: Initialized background tasks (vehicle alerts every 6h)');
  }

  public static stop(): void {
    if (this.scheduler) {
      this.scheduler.stop();
      this.scheduler = null;
      this.isInitialized = false;
      logger.info('ToadScheduler: Background tasks stopped gracefully');
    }
  }

  public static getStatus(): { isRunning: boolean; jobCount: number } {
    return {
      isRunning: this.isInitialized && this.scheduler !== null,
      jobCount: this.scheduler ? 1 : 0,
    };
  }
}

