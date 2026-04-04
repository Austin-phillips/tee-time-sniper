import { supabaseAdmin } from './client';
import logger from '../logger';

const log = logger.child({ module: 'notifications' });

export async function saveNotification(
  userId: string,
  courseName: string,
  title: string,
  body: string
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      course_name: courseName,
      title,
      body,
    });

    if (error) {
      log.error({ userId, err: error.message }, 'Failed to save notification');
    }
  } catch (err) {
    log.error({ userId, err }, 'Failed to save notification');
  }
}
