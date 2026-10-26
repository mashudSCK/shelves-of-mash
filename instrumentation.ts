import type { Instrumentation } from 'next';
import { recordOperationalEvent } from '@/lib/monitoring';
export const onRequestError: Instrumentation.onRequestError = async (_error, _request, context) => {
  // Route templates are application-defined; request URLs and errors may hold secrets.
  await recordOperationalEvent({ kind: 'error', name: context.routePath, status: 'error', detail: 'request_failed' });
};
