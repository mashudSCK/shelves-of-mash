import { createClient } from '@/lib/supabase/server';
import type { WritingCardData, WritingWithRelations, Shelf } from '@/types/database';

const CARD_SELECT = `
  id, slug, title, subtitle, cover_image_url, reading_time_minutes, published_at, is_featured,
  shelf:shelves ( slug, name ),
  tags:writing_tags ( tag:tags ( slug, name ) )
`;

// writing_tags is a join table; Supabase returns nested tag rows we flatten here.
function flattenTags(row: any): WritingCardData {
  return {
    ...row,
    shelf: row.shelf,
    tags: (row.tags ?? []).map((t: any) => t.tag).filter(Boolean),
  };
}

export async function getFeaturedWritings(limit = 4): Promise<WritingCardData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('writings')
    .select(CARD_SELECT)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getFeaturedWritings error', error);
    return [];
  }
  return (data ?? []).map(flattenTags);
}

export async function getRecentWritings(limit = 6): Promise<WritingCardData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('writings')
    .select(CARD_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getRecentWritings error', error);
    return [];
  }
  return (data ?? []).map(flattenTags);
}

export async function getRandomWriting(): Promise<WritingCardData | null> {
  const supabase = await createClient();
  // Random Discovery: use a Postgres function (see migrations) for an
  // efficient random row rather than ORDER BY random() on a large table.
  const { data, error } = await supabase.rpc('get_random_published_writing');

  if (error || !data || data.length === 0) {
    console.error('getRandomWriting error', error);
    return null;
  }
  return flattenTags(data[0]);
}

export async function getPopularWritings(limit = 5): Promise<WritingCardData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('writings')
    .select(CARD_SELECT)
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getPopularWritings error', error);
    return [];
  }
  return (data ?? []).map(flattenTags);
}

export async function getShelves(): Promise<Shelf[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shelves')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('getShelves error', error);
    return [];
  }
  return data ?? [];
}

export async function getShelfCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('writings')
    .select('shelf_id')
    .eq('status', 'published');

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.shelf_id] = (counts[row.shelf_id] ?? 0) + 1;
  }
  return counts;
}

export async function getShelfBySlug(slug: string): Promise<Shelf | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shelves')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}

export async function getWritingsByShelf(shelfSlug: string): Promise<WritingCardData[]> {
  const supabase = await createClient();

  // Resolve the shelf id first — Supabase's JS client can't filter on a
  // nested relation's column directly in the main query, only embed it.
  const { data: shelf, error: shelfError } = await supabase
    .from('shelves')
    .select('id')
    .eq('slug', shelfSlug)
    .single();

  if (shelfError || !shelf) return [];

  const { data, error } = await supabase
    .from('writings')
    .select(CARD_SELECT)
    .eq('status', 'published')
    .eq('shelf_id', shelf.id)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('getWritingsByShelf error', error);
    return [];
  }
  return (data ?? []).map(flattenTags);
}

export async function getWritingBySlug(slug: string): Promise<WritingWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('writings')
    .select(
      `*, shelf:shelves(*), tags:writing_tags ( tag:tags (*) )`
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) return null;

  return {
    ...data,
    tags: (data.tags ?? []).map((t: any) => t.tag).filter(Boolean),
  };
}

export async function getRelatedWritings(
  writingId: string,
  shelfId: string,
  limit = 3
): Promise<WritingCardData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('writings')
    .select(CARD_SELECT)
    .eq('status', 'published')
    .eq('shelf_id', shelfId)
    .neq('id', writingId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getRelatedWritings error', error);
    return [];
  }
  return (data ?? []).map(flattenTags);
}

export async function getThoughtOfTheDay(): Promise<WritingCardData | null> {
  const supabase = await createClient();
  // Deterministic per-day pick: every visitor sees the same "page" of the
  // journal on a given day. We fetch ids ordered stably, then index by the
  // day-of-epoch modulo count, rather than re-rolling randomness per request.
  const { data: ids, error: idsError } = await supabase
    .from('writings')
    .select('id')
    .eq('status', 'published')
    .order('id', { ascending: true });

  if (idsError || !ids || ids.length === 0) return null;

  const dayIndex = Math.floor(Date.now() / 86_400_000) % ids.length;
  const chosenId = ids[dayIndex]!.id;

  const { data, error } = await supabase
    .from('writings')
    .select(CARD_SELECT)
    .eq('id', chosenId)
    .single();

  if (error || !data) return null;
  return flattenTags(data);
}

export async function getAiSummary(writingId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ai_summaries')
    .select('summary')
    .eq('writing_id', writingId)
    .maybeSingle();

  if (error || !data) return null;
  return data.summary;
}

export async function incrementViewCount(writingId: string): Promise<void> {
  const supabase = await createClient();
  // Fire-and-forget RPC; a missed view increment is not worth blocking render on.
  await supabase.rpc('increment_writing_view', { writing_id: writingId });
}

export async function getBookmarkStatus(writingId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('writing_id', writingId)
    .maybeSingle();

  return !!data;
}

export type ArchiveFilters = {
  year?: string;
  shelf?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
};

export async function getArchiveWritings(
  filters: ArchiveFilters
): Promise<{ writings: WritingCardData[]; total: number }> {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('writings')
    .select(CARD_SELECT, { count: 'exact' })
    .eq('status', 'published');

  if (filters.year) {
    query = query
      .gte('published_at', `${filters.year}-01-01`)
      .lt('published_at', `${Number(filters.year) + 1}-01-01`);
  }

  if (filters.shelf) {
    const { data: shelf } = await supabase
      .from('shelves')
      .select('id')
      .eq('slug', filters.shelf)
      .single();
    if (shelf) query = query.eq('shelf_id', shelf.id);
  }

  const { data, error, count } = await query
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('getArchiveWritings error', error);
    return { writings: [], total: 0 };
  }

  let writings = (data ?? []).map(flattenTags);

  // Tag filtering happens client-side-of-query since it's a many-to-many
  // join the count-aware query above doesn't cleanly support; acceptable
  // at MVP scale, revisit with a dedicated junction count if volume grows.
  if (filters.tag) {
    writings = writings.filter((w) => w.tags.some((t) => t.slug === filters.tag));
  }

  return { writings, total: count ?? writings.length };
}

export async function getArchiveYears(): Promise<number[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('writings')
    .select('published_at')
    .eq('status', 'published')
    .not('published_at', 'is', null);

  if (error || !data) return [];

  const years = new Set<number>();
  for (const row of data) {
    if (row.published_at) years.add(new Date(row.published_at).getFullYear());
  }
  return Array.from(years).sort((a, b) => b - a);
}

export async function searchWritings(query: string): Promise<WritingCardData[]> {
  if (!query.trim()) return [];
  const supabase = await createClient();

  // Full-text search against the generated tsvector column (see migrations).
  const { data, error } = await supabase
    .from('writings')
    .select(CARD_SELECT)
    .eq('status', 'published')
    .textSearch('search_vector', query, { type: 'websearch' })
    .limit(20);

  if (error) {
    console.error('searchWritings error', error);
    return [];
  }
  return (data ?? []).map(flattenTags);
}

export async function getWritingsByTag(tagSlug: string): Promise<WritingCardData[]> {
  const supabase = await createClient();
  const { data: tag } = await supabase.from('tags').select('id').eq('slug', tagSlug).maybeSingle();
  if (!tag) return [];

  const { data: relations } = await supabase
    .from('writing_tags')
    .select('writing_id')
    .eq('tag_id', tag.id);
  const writingIds = (relations ?? []).map((relation) => relation.writing_id);
  if (writingIds.length === 0) return [];

  const { data, error } = await supabase
    .from('writings')
    .select(CARD_SELECT)
    .eq('status', 'published')
    .in('id', writingIds)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('getWritingsByTag error', error);
    return [];
  }
  return (data ?? []).map(flattenTags);
}
