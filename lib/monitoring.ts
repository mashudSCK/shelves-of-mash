import { createAdminClient } from '@/lib/supabase/admin';
export type OperationalEvent = { kind: 'error' | 'slow_query' | 'publishing'; name: string; durationMs?: number; status: 'ok' | 'error'; detail?: string };
export async function recordOperationalEvent(event: OperationalEvent): Promise<void> {
  const row = {
    kind: event.kind,
    name: event.name.split(/[?&#]/, 1)[0].replace(/[^a-zA-Z0-9_.:/ -]/g, '').slice(0, 80),
    status: event.status,
    duration_ms: Number.isFinite(event.durationMs) ? Math.max(0, Math.min(Math.round(event.durationMs!), 86_400_000)) : null,
    // Detail is an application code, never arbitrary prose, errors, or user input.
    detail: event.detail && /^[a-zA-Z0-9_.:-]{1,80}$/.test(event.detail) ? event.detail : null,
  };
  try {
    const { error } = await createAdminClient().from('operational_events').insert(row).abortSignal(AbortSignal.timeout(1500));
    if (error) console.error('Operational event storage unavailable', { kind: row.kind, name: row.name });
  } catch { console.error('Operational event storage unavailable', { kind: row.kind, name: row.name }); }
  const endpoint = process.env.MONITORING_WEBHOOK_URL;
  if (!endpoint || event.status !== 'error') return;
  try {
    await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(row), signal: AbortSignal.timeout(1500) });
  } catch { console.error('Operational event delivery unavailable'); }
}
