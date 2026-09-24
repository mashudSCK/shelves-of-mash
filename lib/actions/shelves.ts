'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/require-admin';

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
}

export async function createShelf(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  if (!name) return;

  const { data: maxSort } = await supabase
    .from('shelves')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('shelves').insert({
    name,
    slug: slugify(name),
    description,
    sort_order: (maxSort?.sort_order ?? 0) + 1,
  });

  if (error) redirect('/admin/shelves?error=create_failed');

  revalidatePath('/admin/shelves');
  revalidatePath('/shelves');
  redirect('/admin/shelves?saved=created');
}

export async function deleteShelf(shelfId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { count } = await supabase
    .from('writings')
    .select('id', { count: 'exact', head: true })
    .eq('shelf_id', shelfId);
  if ((count ?? 0) > 0) redirect('/admin/shelves?error=not_empty');

  const { error } = await supabase.from('shelves').delete().eq('id', shelfId);
  if (error) redirect('/admin/shelves?error=delete_failed');
  revalidatePath('/admin/shelves');
  revalidatePath('/shelves');
  redirect('/admin/shelves?saved=deleted');
}
