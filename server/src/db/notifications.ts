import { supabaseAdmin } from './client';

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
      console.error(`Failed to save notification for user ${userId}:`, error.message);
    }
  } catch (err) {
    console.error(`Failed to save notification for user ${userId}:`, err);
  }
}
