import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { invalidatePublicContent } from '@/lib/data/public-cache';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('writings')
    .update({ status: 'published', published_at: now, scheduled_for: null })
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .select('id, slug');

  if (error) {
    console.error('Scheduled publication failed', error);
    return NextResponse.json({ error: 'Publication failed' }, { status: 500 });
  }

  invalidatePublicContent();
  revalidatePath('/');
  revalidatePath('/archive');
  revalidatePath('/shelves');
  for (const writing of data ?? []) revalidatePath(`/writing/${writing.slug}`);

  return NextResponse.json({ published: data?.length ?? 0 });
}
