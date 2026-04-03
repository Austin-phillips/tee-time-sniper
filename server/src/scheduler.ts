import cron from 'node-cron';
import { pollForTeeTimesOnce } from './poller';

const POLL_INTERVAL = process.env.POLL_CRON ?? '* * * * *'; // Every minute

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
