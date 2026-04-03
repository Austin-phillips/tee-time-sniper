import { supabaseAdmin } from './client';

export async function getPushTokens(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to fetch push tokens: ${error.message}`);
  return (data ?? []).map((row) => row.token);
}
