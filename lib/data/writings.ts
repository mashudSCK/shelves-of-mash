import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import { publicRead } from '@/lib/data/public-cache';
import { pageRange, PUBLIC_PAGE_SIZE } from '@/lib/pagination';
import type { WritingCardData, WritingWithRelations, Shelf } from '@/types/database';

export const CARD_SELECT = `
  id, slug, title, subtitle, cover_image_url, reading_time_minutes, published_at, is_featured,
  shelf:shelves ( slug, name ), tags:writing_tags ( tag:tags ( slug, name ) )
`;
export type WritingPage = { writings: WritingCardData[]; total: number };

export function flattenTags(row: any): WritingCardData {
  return { ...row, tags: (row.tags ?? []).map((t: any) => t.tag).filter(Boolean) };
}

const featured = publicRead('featured', async (limit: number) => {
  const { data, error } = await createPublicClient().from('writings').select(CARD_SELECT)
    .eq('status', 'published').eq('is_featured', true)
    .order('published_at', { ascending: false, nullsFirst: false }).order('id', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map(flattenTags);
});
export function getFeaturedWritings(limit = 4) { return featured(pageRange(1, limit).pageSize); }

const recent = publicRead('recent', async (limit: number) => {
  const { data, error } = await createPublicClient().from('writings').select(CARD_SELECT)
    .eq('status', 'published').order('published_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map(flattenTags);
});
export function getRecentWritings(limit = 6) { return recent(pageRange(1, limit).pageSize); }

const popular = publicRead('popular', async (limit: number) => {
  const { data, error } = await createPublicClient().from('writings').select(CARD_SELECT)
    .eq('status', 'published').order('view_count', { ascending: false }).order('id', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map(flattenTags);
});
export function getPopularWritings(limit = 5) { return popular(pageRange(1, limit).pageSize); }

export const getShelves = publicRead('shelves', async (): Promise<Shelf[]> => {
  const client = createPublicClient();
  const shelves: Shelf[] = [];
  let lastId: string | undefined;
  while (true) {
    let query = client.from('shelves').select('*').order('id').limit(500);
    if (lastId) query = query.gt('id', lastId);
    const { data, error } = await query;
    if (error) throw error;
    shelves.push(...(data ?? []));
    if (!data?.length || data.length < 500) break;
    lastId = data[data.length - 1]!.id;
  }
  return shelves.sort((a,b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
});

export const getShelfCounts = publicRead('shelf-counts', async (): Promise<Record<string, number>> => {
  const { data, error } = await createPublicClient().rpc('get_shelf_counts');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row: any) => [row.shelf_id, Number(row.writing_count)]));
});

export const getShelfBySlug = publicRead('shelf', async (slug: string): Promise<Shelf | null> => {
  const { data, error } = await createPublicClient().from('shelves').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data;
});

export type ArchiveFilters = { year?: string; shelf?: string; tag?: string; q?: string; page?: number; pageSize?: number };
const archive = publicRead('archive', async (
  year: string, shelf: string, tag: string, q: string, page: number, pageSize: number
): Promise<WritingPage> => {
  const { from, to } = pageRange(page, pageSize);
  // Filter aliases leave the card's full tag list intact while constraining parent rows.
  const select = CARD_SELECT + (shelf ? ',shelf_filter:shelves!inner(slug)' : '')
    + (tag ? ',tags_filter:writing_tags!inner(tag:tags!inner(slug))' : '');
  let query = createPublicClient().from('writings').select(select, { count: 'exact' }).eq('status', 'published');
  if (year) query = query.gte('published_at', `${year}-01-01`).lt('published_at', `${Number(year)+1}-01-01`);
  if (shelf) query = query.eq('shelf_filter.slug', shelf);
  if (tag) query = query.eq('tags_filter.tag.slug', tag);
  if (q) query = query.textSearch('search_vector', q, { type: 'websearch' });
  const { data, error, count } = await query.order('published_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false }).range(from, to);
  if (error) throw error;
  return { writings: (data ?? []).map(flattenTags), total: count ?? 0 };
});
export function getArchiveWritings(filters: ArchiveFilters): Promise<WritingPage> {
  const { page, pageSize } = pageRange(filters.page, filters.pageSize ?? PUBLIC_PAGE_SIZE);
  const year = typeof filters.year === 'string' && /^(?:[1-9]\d{3})$/.test(filters.year) ? filters.year : '';
  return archive(year, typeof filters.shelf === 'string' ? filters.shelf.slice(0, 200) : '',
    typeof filters.tag === 'string' ? filters.tag.slice(0, 200) : '',
    typeof filters.q === 'string' ? filters.q.trim().slice(0, 500) : '', page, pageSize);
}
export function getWritingsByShelf(slug: string, page = 1) { return getArchiveWritings({ shelf: slug, page }); }
export function searchWritings(query: string, page = 1): Promise<WritingPage> {
  return query.trim() ? getArchiveWritings({ q: query, page }) : Promise.resolve({ writings: [], total: 0 });
}
export function getWritingsByTag(tag: string, page = 1) { return getArchiveWritings({ tag, page }); }

export const getArchiveYears = publicRead('archive-years', async (): Promise<number[]> => {
  const { data, error } = await createPublicClient().rpc('get_archive_years');
  if (error) throw error;
  return (data ?? []).map((row: any) => Number(row.year));
});

export const getWritingBySlug = publicRead('writing', async (slug: string): Promise<WritingWithRelations | null> => {
  const { data, error } = await createPublicClient().from('writings')
    .select('*, shelf:shelves(*), tags:writing_tags(tag:tags(*))').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) throw error;
  return data ? { ...data, tags: (data.tags ?? []).map((t: any) => t.tag).filter(Boolean) } : null;
});

const related = publicRead('related', async (id: string, shelfId: string, limit: number) => {
  const { data, error } = await createPublicClient().from('writings').select(CARD_SELECT)
    .eq('status', 'published').eq('shelf_id', shelfId).neq('id', id)
    .order('published_at', { ascending: false, nullsFirst: false }).order('id', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map(flattenTags);
});
export function getRelatedWritings(id: string, shelfId: string, limit = 3) {
  return related(id, shelfId, pageRange(1, limit).pageSize);
}

const daily = publicRead('daily', async (day: number): Promise<WritingCardData | null> => {
  const client = createPublicClient();
  const { data: id, error } = await client.rpc('get_daily_writing_id', { day_number: day });
  if (error) throw error;
  if (!id) return null;
  const { data, error: cardError } = await client.from('writings').select(CARD_SELECT).eq('id', id)
    .eq('status', 'published').maybeSingle();
  if (cardError) throw cardError;
  return data ? flattenTags(data) : null;
});
export function getThoughtOfTheDay() { return daily(Math.floor(Date.now()/86_400_000)); }

export async function getRandomWriting(): Promise<WritingCardData | null> {
  return daily(Math.floor(Math.random()*1_000_000_000));
}

export const getAiSummary = publicRead('summary', async (writingId: string): Promise<string | null> => {
  const { data, error } = await createPublicClient().from('ai_summaries').select('summary')
    .eq('writing_id', writingId).maybeSingle();
  if (error) throw error;
  return data?.summary ?? null;
});

export async function getBookmarkStatus(writingId: string): Promise<boolean> {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return false;
  const { data, error } = await client.from('bookmarks').select('id').eq('user_id', user.id)
    .eq('writing_id', writingId).maybeSingle();
  if (error) throw error;
  return !!data;
}
