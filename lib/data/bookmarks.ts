import { createClient } from '@/lib/supabase/server';
import { CARD_SELECT, flattenTags, type WritingPage } from '@/lib/data/writings';
import { pageRange } from '@/lib/pagination';

export async function getBookmarkedWritings(page = 1): Promise<WritingPage> {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { writings: [], total: 0 };
  const { from, to } = pageRange(page);
  const { data, error, count } = await client.from('bookmarks')
    .select(`writing:writings!inner(${CARD_SELECT})`, { count: 'exact' })
    .eq('user_id', user.id).eq('writing.status', 'published')
    .order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to);
  if (error) throw error;
  return { writings: (data ?? []).map((row: any) => flattenTags(row.writing)), total: count ?? 0 };
}
