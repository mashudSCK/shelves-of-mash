import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Shelf } from '@/types/database';

export function ShelfCard({ shelf, count }: { shelf: Shelf; count: number }) {
  return (
    <Link
      href={`/shelves/${shelf.slug}`}
      className="group flex flex-col justify-between gap-3 rounded-md border border-border bg-surface p-5 transition-colors hover:border-accent/60"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="break-words font-serif text-xl font-medium text-foreground group-hover:text-accent">
          {shelf.name}
        </h3>
        <ArrowUpRight
          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
          aria-hidden="true"
        />
      </div>
      {shelf.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{shelf.description}</p>
      )}
      <span className="text-2xs uppercase tracking-widest2 text-muted-foreground">
        {count} {count === 1 ? 'writing' : 'writings'}
      </span>
    </Link>
  );
}
