import { getPushTokens } from '../db/push-tokens';
import { saveNotification } from '../db/notifications';

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
      console.error(`Expo push API error: ${response.status} ${text}`);
    } else {
      console.log(`Push sent to ${tokens.length} device(s) for user ${userId} — ${title}: ${body}`);
    }
  } else {
    console.warn(`No push tokens for user ${userId}, skipping push (notification still saved)`);
  }

  await saveNotification(userId, courseName, title, body);
}
