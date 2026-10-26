import 'server-only';
import { unstable_cache, revalidateTag } from 'next/cache';
import { recordOperationalEvent } from '@/lib/monitoring';

export function publicRead<Args extends unknown[], Result>(name: string, read: (...args: Args) => Promise<Result>) {
  return unstable_cache(async (...args: Args): Promise<Result> => {
    const started = performance.now();
    try {
      const result = await read(...args);
      const durationMs = performance.now() - started;
      if (durationMs >= 1000) {
        await recordOperationalEvent({ kind: 'slow_query', name: `read:${name}`, status: 'ok', durationMs });
      }
      return result;
    } catch (error) {
      await recordOperationalEvent({ kind: 'error', name: `read:${name}`, status: 'error', detail: 'read_failed' });
      throw error;
    }
  }, [name, process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''], {
    revalidate: 120,
    tags: ['public-content'],
  });
}

export function invalidatePublicContent() {
  // Immediate expiry also covers unpublishing; do not serve stale private content.
  revalidateTag('public-content', { expire: 0 });
}
