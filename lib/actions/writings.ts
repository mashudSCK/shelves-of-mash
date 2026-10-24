'use server';

import { revalidatePath } from 'next/cache';
import { invalidatePublicContent } from '@/lib/data/public-cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { removeWritingCover, uploadWritingCover } from '@/lib/storage/covers';
import type { WritingStatus } from '@/types/database';

const VALID_STATUSES = new Set<WritingStatus>([
  'draft',
  'published',
  'archived',
  'scheduled',
]);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export type WritingFormState = {
  error?: string;
  fieldErrors?: Partial<Record<'title' | 'slug' | 'content' | 'shelf' | 'schedule', string>>;
} | undefined;

type ParsedWriting = {
  title: string;
  subtitle: string | null;
  slug: string;
  content: string;
  shelfId: string;
  status: WritingStatus;
  existingCoverUrl: string | null;
  removeCover: boolean;
  coverFile: File | null;
  isFeatured: boolean;
  tagNames: string[];
  scheduledFor: string | null;
};

function parseWritingForm(formData: FormData): { value?: ParsedWriting; state?: WritingFormState } {
  const title = String(formData.get('title') ?? '').trim();
  const requestedSlug = String(formData.get('slug') ?? '').trim();
  const slug = slugify(requestedSlug || title);
  const content = String(formData.get('content') ?? '').trim();
  const shelfId = String(formData.get('shelf_id') ?? '');
  const requestedStatus = String(formData.get('status') ?? 'draft') as WritingStatus;
  const status = VALID_STATUSES.has(requestedStatus) ? requestedStatus : 'draft';
  const rawSchedule = String(formData.get('scheduled_for') ?? '').trim();
  const fieldErrors: NonNullable<WritingFormState>['fieldErrors'] = {};

  if (!title) fieldErrors.title = 'Enter a title.';
  if (!slug) fieldErrors.slug = 'Enter a valid slug.';
  if (!content) fieldErrors.content = 'Add some content.';
  if (!shelfId) fieldErrors.shelf = 'Choose a shelf.';

  let scheduledFor: string | null = null;
  if (status === 'scheduled') {
    const date = new Date(rawSchedule);
    if (!rawSchedule || Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      fieldErrors.schedule = 'Choose a future publication date and time.';
    } else {
      scheduledFor = date.toISOString();
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { state: { error: 'Please fix the highlighted fields.', fieldErrors } };
  }

  const fileValue = formData.get('cover_image');
  const coverFile = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  const tagNames = Array.from(
    new Set(
      String(formData.get('tags') ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  ).slice(0, 20);

  return {
    value: {
      title,
      subtitle: String(formData.get('subtitle') ?? '').trim() || null,
      slug,
      content,
      shelfId,
      status,
      existingCoverUrl: String(formData.get('existing_cover_url') ?? '').trim() || null,
      removeCover: formData.get('remove_cover') === 'on',
      coverFile,
      isFeatured: formData.get('is_featured') === 'on',
      tagNames,
      scheduledFor,
    },
  };
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase.from('writings').select('id').eq('slug', slug);
  if (excludeId) query = query.neq('id', excludeId);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

async function resolveCover(
  parsed: ParsedWriting
): Promise<{ coverUrl: string | null; uploadedUrl?: string; error?: string }> {
  const supabase = await createClient();
  if (parsed.coverFile) {
    const upload = await uploadWritingCover(supabase, parsed.coverFile);
    if (upload.error || !upload.url) return { coverUrl: null, error: upload.error };
    return { coverUrl: upload.url, uploadedUrl: upload.url };
  }
  return { coverUrl: parsed.removeCover ? null : parsed.existingCoverUrl };
}

function revalidateWritingPaths(slug?: string) {
  invalidatePublicContent();
  revalidatePath('/');
  revalidatePath('/archive');
  revalidatePath('/shelves');
  revalidatePath('/admin');
  revalidatePath('/admin/writings');
  if (slug) revalidatePath(`/writing/${slug}`);
}

export async function createWriting(
  _prev: WritingFormState,
  formData: FormData
): Promise<WritingFormState> {
  await requireAdmin();
  const parsedResult = parseWritingForm(formData);
  if (!parsedResult.value) return parsedResult.state;
  const parsed = parsedResult.value;

  if (await slugExists(parsed.slug)) {
    return { error: 'That URL slug is already in use.', fieldErrors: { slug: 'Choose a unique slug.' } };
  }

  const cover = await resolveCover(parsed);
  if (cover.error) return { error: cover.error };

  const supabase = await createClient();
  const { data: writing, error } = await supabase
    .from('writings')
    .insert({
      title: parsed.title,
      subtitle: parsed.subtitle,
      slug: parsed.slug,
      content: parsed.content,
      shelf_id: parsed.shelfId,
      status: parsed.status,
      cover_image_url: cover.coverUrl,
      is_featured: parsed.isFeatured,
      reading_time_minutes: estimateReadingMinutes(parsed.content),
      published_at: parsed.status === 'published' ? new Date().toISOString() : null,
      scheduled_for: parsed.scheduledFor,
    })
    .select('id')
    .single();

  if (error || !writing) {
    if (cover.uploadedUrl) await removeWritingCover(supabase, cover.uploadedUrl);
    return { error: error?.message ?? 'Failed to create writing.' };
  }

  await attachTags(writing.id, parsed.tagNames);
  revalidateWritingPaths(parsed.slug);
  redirect('/admin/writings?saved=created');
}

export async function updateWriting(
  writingId: string,
  _prev: WritingFormState,
  formData: FormData
): Promise<WritingFormState> {
  await requireAdmin();
  const parsedResult = parseWritingForm(formData);
  if (!parsedResult.value) return parsedResult.state;
  const parsed = parsedResult.value;

  if (await slugExists(parsed.slug, writingId)) {
    return { error: 'That URL slug is already in use.', fieldErrors: { slug: 'Choose a unique slug.' } };
  }

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from('writings')
    .select('status, published_at, cover_image_url, slug')
    .eq('id', writingId)
    .single();
  if (currentError || !current) return { error: 'Writing could not be found.' };

  const cover = await resolveCover(parsed);
  if (cover.error) return { error: cover.error };

  const newlyPublished = parsed.status === 'published' && current.status !== 'published';
  const { error } = await supabase
    .from('writings')
    .update({
      title: parsed.title,
      subtitle: parsed.subtitle,
      slug: parsed.slug,
      content: parsed.content,
      shelf_id: parsed.shelfId,
      status: parsed.status,
      cover_image_url: cover.coverUrl,
      is_featured: parsed.isFeatured,
      reading_time_minutes: estimateReadingMinutes(parsed.content),
      published_at: newlyPublished ? new Date().toISOString() : current.published_at,
      scheduled_for: parsed.scheduledFor,
    })
    .eq('id', writingId);

  if (error) {
    if (cover.uploadedUrl) await removeWritingCover(supabase, cover.uploadedUrl);
    return { error: error.message };
  }

  if (current.cover_image_url !== cover.coverUrl) {
    await removeWritingCover(supabase, current.cover_image_url);
  }
  await supabase.from('writing_tags').delete().eq('writing_id', writingId);
  await attachTags(writingId, parsed.tagNames);

  revalidateWritingPaths(current.slug);
  if (current.slug !== parsed.slug) revalidateWritingPaths(parsed.slug);
  redirect('/admin/writings?saved=updated');
}

export async function deleteWriting(writingId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: writing } = await supabase
    .from('writings')
    .select('cover_image_url, slug')
    .eq('id', writingId)
    .single();
  const { error } = await supabase.from('writings').delete().eq('id', writingId);
  if (error) redirect('/admin/writings?error=delete_failed');
  if (writing) await removeWritingCover(supabase, writing.cover_image_url);
  revalidateWritingPaths(writing?.slug);
  redirect('/admin/writings?saved=deleted');
}

export async function archiveWriting(writingId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from('writings')
    .update({ status: 'archived', scheduled_for: null })
    .eq('id', writingId);
  revalidateWritingPaths();
}

export async function restoreWriting(writingId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from('writings')
    .update({ status: 'draft', scheduled_for: null })
    .eq('id', writingId);
  revalidateWritingPaths();
}

async function attachTags(writingId: string, tagNames: string[]) {
  if (tagNames.length === 0) return;
  const supabase = await createClient();
  const tagIds: string[] = [];

  for (const name of tagNames) {
    const slug = slugify(name);
    if (!slug) continue;
    const { data: existing } = await supabase.from('tags').select('id').eq('slug', slug).maybeSingle();
    if (existing) {
      tagIds.push(existing.id);
      continue;
    }
    const { data: created } = await supabase
      .from('tags')
      .insert({ slug, name })
      .select('id')
      .single();
    if (created) tagIds.push(created.id);
  }

  if (tagIds.length > 0) {
    await supabase
      .from('writing_tags')
      .insert(tagIds.map((tagId) => ({ writing_id: writingId, tag_id: tagId })));
  }
}
