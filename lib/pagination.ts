export const PUBLIC_PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 20;

export function parsePage(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') return 1;
  if (!/^\d+$/.test(String(value))) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && page <= 1_000_000 ? page : 1;
}

export function pageRange(value: unknown, size = PUBLIC_PAGE_SIZE) {
  const page = parsePage(value);
  const pageSize = Number.isFinite(size) ? Math.max(1, Math.min(100, Math.trunc(size))) : PUBLIC_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  return { page, pageSize, from, to: from + pageSize - 1 };
}
