/** Accept only unambiguous local paths for post-login navigation. */
export function localDestination(value: string | null): string {
  if (!value || value.length > 2048 || !value.startsWith('/')) return '/';
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(decoded)) return '/';
    const url = new URL(value, 'https://local.invalid');
    if (url.origin !== 'https://local.invalid' || url.pathname.startsWith('//')) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}
