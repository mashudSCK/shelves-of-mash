import { createClient } from '@/lib/supabase/server';
import { ADMIN_PAGE_SIZE, pageRange } from '@/lib/pagination';
import type { Writing, WritingStatus } from '@/types/database';

export type DashboardStats = {
  totalWritings: number; totalViews: number;
  mostViewed: { title: string; slug: string; view_count: number }[];
  mostBookmarked: { title: string; slug: string; bookmark_count: number }[];
  draftCount: number; publishedCount: number; archivedCount: number; scheduledCount: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const client = await createClient();
  const { data, error } = await client.rpc('get_dashboard_stats');
  if (error) throw error;
  return data as DashboardStats;
}

export type AdminWritingRow = Pick<Writing, 'id' | 'title' | 'slug' | 'updated_at' | 'status'>;
export async function getWritingsByStatus(status: WritingStatus, page = 1): Promise<{ writings: AdminWritingRow[]; total: number }> {
  const { from, to } = pageRange(page, ADMIN_PAGE_SIZE);
  const client = await createClient();
  const { data, error, count } = await client.from('writings')
    .select('id,title,slug,updated_at,status', { count: 'exact' }).eq('status', status)
    .order('updated_at', { ascending: false }).order('id', { ascending: false }).range(from, to);
  if (error) throw error;
  return { writings: data ?? [], total: count ?? 0 };
}

export async function getWritingByIdForEdit(id: string) {
  const client = await createClient();
  const { data, error } = await client.from('writings').select('*, tags:writing_tags(tag:tags(*))').eq('id', id).single();
  if (error || !data) return null;
  return { ...data, tags: (data.tags ?? []).map((t: any) => t.tag).filter(Boolean) };
}
