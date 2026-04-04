import cron from 'node-cron';
import logger from './logger';
import { pollForTeeTimesOnce } from './poller';

const log = logger.child({ module: 'scheduler' });

// Every 5 minutes, 5am–1am Mountain Time (UTC offset: 5am MT = 11 UTC, 1am MT = 7 UTC)
const POLL_INTERVAL = process.env.POLL_CRON ?? '*/5 5-23,0 * * *';

export function startScheduler(): void {
  log.info({ cronInterval: POLL_INTERVAL }, 'Starting scheduler');

  // Run immediately on startup
  pollForTeeTimesOnce().catch((err) => {
    log.error({ err }, 'Initial poll failed');
  });

  // Then run on schedule
  cron.schedule(POLL_INTERVAL, async () => {
    try {
      await pollForTeeTimesOnce();
    } catch (err) {
      log.error({ err }, 'Scheduled poll failed');
    }
  });
}
