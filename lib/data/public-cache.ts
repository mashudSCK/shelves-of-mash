import 'server-only';
import { unstable_cache, revalidateTag } from 'next/cache';

export function publicRead<Args extends unknown[], Result>(name: string, read: (...args: Args) => Promise<Result>) {
  return unstable_cache(read, [name, process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''], {
    revalidate: 120,
    tags: ['public-content'],
  });
}

export function invalidatePublicContent() {
  // Immediate expiry also covers unpublishing; do not serve stale private content.
  revalidateTag('public-content', { expire: 0 });
}
