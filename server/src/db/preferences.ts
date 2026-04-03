import { supabaseAdmin } from './client';
import { Preference, Course } from '../types';

export async function getActivePreferences(): Promise<Preference[]> {
  const { data, error } = await supabaseAdmin
    .from('preferences')
    .select('*')
    .eq('active', true);

  if (error) throw new Error(`Failed to fetch preferences: ${error.message}`);
  return data ?? [];
}

export async function getCoursesByIds(courseIds: string[]): Promise<Course[]> {
  if (courseIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('*')
    .in('id', courseIds);

  if (error) throw new Error(`Failed to fetch courses: ${error.message}`);
  return data ?? [];
}
