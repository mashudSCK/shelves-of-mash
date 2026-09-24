import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'writing-covers';
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export async function uploadWritingCover(
  supabase: SupabaseClient,
  file: File
): Promise<{ url?: string; error?: string }> {
  if (!EXTENSIONS[file.type]) {
    return { error: 'Cover images must be JPEG, PNG, WebP, or AVIF.' };
  }
  if (file.size > MAX_BYTES) {
    return { error: 'Cover images must be 5 MB or smaller.' };
  }

  const objectPath = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  });

  if (error) return { error: `Cover upload failed: ${error.message}` };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return { url: data.publicUrl };
}

export async function removeWritingCover(
  supabase: SupabaseClient,
  publicUrl: string | null | undefined
): Promise<void> {
  if (!publicUrl) return;

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) return;

  const objectPath = decodeURIComponent(publicUrl.slice(markerIndex + marker.length));
  if (objectPath) await supabase.storage.from(BUCKET).remove([objectPath]);
}
