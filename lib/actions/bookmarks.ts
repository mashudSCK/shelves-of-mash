'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleBookmark(writingId: string): Promise<{ bookmarked: boolean } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('writing_id', writingId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('bookmarks').delete().eq('id', existing.id);
    if (error) return { error: error.message };
    revalidatePath('/account');
    return { bookmarked: false };
  }

  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: user.id, writing_id: writingId });

  if (error) return { error: error.message };
  revalidatePath('/account');
  return { bookmarked: true };
}
