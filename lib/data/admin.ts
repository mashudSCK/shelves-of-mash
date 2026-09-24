import { createClient } from '@/lib/supabase/server';
import type { Writing, WritingStatus } from '@/types/database';

export type DashboardStats = {
  totalWritings: number;
  totalViews: number;
  mostViewed: { title: string; slug: string; view_count: number }[];
  mostBookmarked: { title: string; slug: string; bookmark_count: number }[];
  draftCount: number;
  publishedCount: number;
  archivedCount: number;
  scheduledCount: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [totalsRes, viewedRes, statusRes] = await Promise.all([
    supabase.from('writings').select('view_count'),
    supabase
      .from('writings')
      .select('title, slug, view_count')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(5),
    supabase.from('writings').select('status'),
  ]);

  const totalViews = (totalsRes.data ?? []).reduce((sum, r) => sum + (r.view_count ?? 0), 0);

  const counts = { draft: 0, published: 0, archived: 0, scheduled: 0 };
  for (const row of statusRes.data ?? []) {
    const s = row.status as WritingStatus;
    if (s in counts) counts[s as keyof typeof counts]++;
  }

  // Most-bookmarked requires counting the join table; done client-side here
  // since dashboard scale is small. A materialized view is the natural
  // next step if the archive grows large.
  const { data: bookmarkRows } = await supabase
    .from('bookmarks')
    .select('writing_id, writings(title, slug)');

  const bookmarkCounts = new Map<string, { title: string; slug: string; count: number }>();
  for (const row of bookmarkRows ?? []) {
    const w = (row as any).writings;
    if (!w) continue;
    const key = row.writing_id as string;
    const entry = bookmarkCounts.get(key) ?? { title: w.title, slug: w.slug, count: 0 };
    entry.count++;
    bookmarkCounts.set(key, entry);
  }
  const mostBookmarked = Array.from(bookmarkCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((e) => ({ title: e.title, slug: e.slug, bookmark_count: e.count }));

  return {
    totalWritings: (statusRes.data ?? []).length,
    totalViews,
    mostViewed: viewedRes.data ?? [],
    mostBookmarked,
    draftCount: counts.draft,
    publishedCount: counts.published,
    archivedCount: counts.archived,
    scheduledCount: counts.scheduled,
  };
}

export async function getWritingsByStatus(status: WritingStatus): Promise<Writing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('writings')
    .select('*')
    .eq('status', status)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('getWritingsByStatus error', error);
    return [];
  }
  return data ?? [];
}

export async function getWritingByIdForEdit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('writings')
    .select('*, tags:writing_tags(tag:tags(*))')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return {
    ...data,
    tags: (data.tags ?? []).map((t: any) => t.tag).filter(Boolean),
  };
}
