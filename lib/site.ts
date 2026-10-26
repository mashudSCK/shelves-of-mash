export function siteUrl(path = ''): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
    || 'https://shelves-of-mash.vercel.app';
  const url = new URL(configured);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without credentials.');
  }
  if (path && (!path.startsWith('/') || path.startsWith('//'))) throw new Error('Site paths must be local.');
  return path ? new URL(path, url.origin).toString() : url.origin;
}
