import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Invalid writing' }, { status: 400 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  let visitorId: unknown;
  try {
    const body = await request.json();
    visitorId = body?.visitorId;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (visitorId != null && (typeof visitorId !== 'string' || !UUID.test(visitorId))) {
    return NextResponse.json({ error: 'Invalid reader' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('increment_writing_view', {
    writing_id: id,
    visitor_id: visitorId ?? null,
  });
  if (error) {
    console.error('Recording writing view failed', error.code);
    return NextResponse.json({ error: 'View unavailable' }, { status: 503 });
  }
  return new NextResponse(null, { status: 204 });
}
