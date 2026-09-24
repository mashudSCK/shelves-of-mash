'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Shelf } from '@/types/database';

export function ArchiveFilters({
  years,
  shelves,
}: {
  years: number[];
  shelves: Shelf[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page'); // reset pagination when filters change
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:max-w-xl">
      <select
        aria-label="Filter by year"
        value={searchParams.get('year') ?? ''}
        onChange={(e) => updateFilter('year', e.target.value)}
        className="min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-foreground sm:text-sm"
      >
        <option value="">All years</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by shelf"
        value={searchParams.get('shelf') ?? ''}
        onChange={(e) => updateFilter('shelf', e.target.value)}
        className="min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-foreground sm:text-sm"
      >
        <option value="">All shelves</option>
        {shelves.map((s) => (
          <option key={s.id} value={s.slug}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
