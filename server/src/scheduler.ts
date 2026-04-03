import cron from 'node-cron';
import { pollForTeeTimesOnce } from './poller';

// Every 5 minutes, 5am–1am Mountain Time (UTC offset: 5am MT = 11 UTC, 1am MT = 7 UTC)
const POLL_INTERVAL = process.env.POLL_CRON ?? '*/5 5-23,0 * * *';

export function startScheduler(): void {
  console.log(`Starting scheduler with cron: ${POLL_INTERVAL}`);

  // Run immediately on startup
  pollForTeeTimesOnce().catch((err) => {
    console.error('Initial poll failed:', err);
  });

  // Then run on schedule
  cron.schedule(POLL_INTERVAL, async () => {
    try {
      await pollForTeeTimesOnce();
    } catch (err) {
      console.error('Scheduled poll failed:', err);
    }
  });
}
