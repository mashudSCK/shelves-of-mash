import type { Instrumentation } from 'next';

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  const digest = typeof error === 'object' && error && 'digest' in error
    ? String(error.digest)
    : undefined;
  console.error('Unhandled request error', {
    message: normalizedError.message,
    digest,
    path: request.path,
    method: request.method,
    route: context.routePath,
    routeType: context.routeType,
  });

  const endpoint = process.env.MONITORING_WEBHOOK_URL;
  if (!endpoint) return;

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: normalizedError.message,
        digest,
        path: request.path,
        method: request.method,
        route: context.routePath,
        routeType: context.routeType,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (monitoringError) {
    console.error('Monitoring delivery failed', monitoringError);
  }
};
