import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';

export default async function HealthPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from('operational_events')
    .select('id, created_at, kind, name, status, duration_ms, detail')
    .order('created_at', { ascending: false }).limit(50);
  return (
    <div className="space-y-6">
      <header>
        <p className="text-2xs uppercase tracking-widest2 text-accent">Administrator</p>
        <h1 className="mt-1 font-serif text-2xl font-medium">Operational health</h1>
        <p className="mt-2 text-sm text-muted-foreground">The 50 most recent recorded events. An empty log does not confirm service availability.</p>
      </header>
      {error ? <p role="status">Event history is unavailable. Check database setup and server logs.</p> : (
        <ul className="divide-y divide-border">
          {!data?.length && <li className="py-4 text-sm text-muted-foreground">No operational events recorded.</li>}
          {data?.map(event => (
            <li key={event.id} className="space-y-1 py-4 text-sm">
              <p className="break-words font-medium">{event.name} — {event.status === 'ok' ? 'Succeeded' : 'Failed'}</p>
              <p className="text-muted-foreground">{event.kind} · <time dateTime={event.created_at}>{new Date(event.created_at).toISOString()}</time>{event.duration_ms !== null ? ` · ${event.duration_ms} ms` : ''}</p>
              {event.detail && <p className="break-words text-muted-foreground">{event.detail}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
