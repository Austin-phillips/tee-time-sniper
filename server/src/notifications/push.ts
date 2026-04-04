import { getPushTokens } from '../db/push-tokens';
import { saveNotification } from '../db/notifications';
import logger from '../logger';

const log = logger.child({ module: 'push' });

export async function sendBatchPushNotification(
  userId: string,
  courseName: string,
  newCount: number
): Promise<void> {
  const title = `⛳ ${courseName}`;
  const body = `${newCount} new tee time${newCount === 1 ? '' : 's'} found`;

  const tokens = await getPushTokens(userId);

  if (tokens.length > 0) {
    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default' as const,
      title,
      body,
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const text = await response.text();
      log.error({ userId, status: response.status, responseBody: text }, 'Expo push API error');
    } else {
      log.info({ userId, tokenCount: tokens.length, title, body }, 'Push sent');
    }
  } else {
    log.warn({ userId }, 'No push tokens, skipping push (notification still saved)');
  }

  await saveNotification(userId, courseName, title, body);
}
