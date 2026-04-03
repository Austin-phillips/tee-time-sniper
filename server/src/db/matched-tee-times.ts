import { supabaseAdmin } from './client';

export interface MatchedTeeTimeRow {
  id: string;
  user_id: string;
  preference_id: string;
  course_id: string;
  course_name: string;
  tee_time: string;
  players_available: number;
  price: number;
  booking_url: string;
}

export interface InsertMatchedTeeTime {
  user_id: string;
  preference_id: string;
  course_id: string;
  course_name: string;
  tee_time: string;
  players_available: number;
  price: number;
  booking_url: string;
}

export async function getMatchedTeeTimes(preferenceId: string): Promise<MatchedTeeTimeRow[]> {
  const { data, error } = await supabaseAdmin
    .from('matched_tee_times')
    .select('*')
    .eq('preference_id', preferenceId);

  if (error) throw new Error(`Failed to fetch matched tee times: ${error.message}`);
  return data ?? [];
}

export async function insertMatchedTeeTimes(rows: InsertMatchedTeeTime[]): Promise<void> {
  if (rows.length === 0) return;

  const { error } = await supabaseAdmin
    .from('matched_tee_times')
    .upsert(rows, { onConflict: 'preference_id,tee_time', ignoreDuplicates: true });

  if (error) throw new Error(`Failed to insert matched tee times: ${error.message}`);
}

export async function deleteMatchedTeeTimes(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabaseAdmin
    .from('matched_tee_times')
    .delete()
    .in('id', ids);

  if (error) throw new Error(`Failed to delete matched tee times: ${error.message}`);
}

export async function deleteStaleTeeTimes(): Promise<void> {
  const { error } = await supabaseAdmin
    .from('matched_tee_times')
    .delete()
    .lt('tee_time', new Date().toISOString());

  if (error) throw new Error(`Failed to delete stale tee times: ${error.message}`);
}
