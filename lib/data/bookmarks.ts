import { createClient } from '@/lib/supabase/server';
import type { WritingCardData } from '@/types/database';

export async function getBookmarkedWritings(): Promise<WritingCardData[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('bookmarks')
    .select(
      `writing:writings (
        id, slug, title, subtitle, cover_image_url, reading_time_minutes, published_at, is_featured,
        shelf:shelves ( slug, name ),
        tags:writing_tags ( tag:tags ( slug, name ) )
      )`
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data
    .map((row: any) => row.writing)
    .filter(Boolean)
    .map((w: any) => ({
      ...w,
      tags: (w.tags ?? []).map((t: any) => t.tag).filter(Boolean),
    }));
}
