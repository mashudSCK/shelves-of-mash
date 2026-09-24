import type { Metadata } from 'next';
import Link from 'next/link';
import { Map } from 'lucide-react';
import { ShelfCard } from '@/components/shelves/shelf-card';
import { getShelves, getShelfCounts } from '@/lib/data/writings';

export const metadata: Metadata = {
  title: 'Shelves',
  description: 'Browse the library by shelf — society, philosophy, culture, and more.',
};

export const revalidate = 300;

export default async function ShelvesPage() {
  const [shelves, shelfCounts] = await Promise.all([getShelves(), getShelfCounts()]);

  return (
    <div className="mx-auto max-w-shelf px-4 py-10 md:px-8">
      <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-prose">
          <p className="text-2xs uppercase tracking-widest2 text-accent">The library</p>
          <h1 className="mt-2 font-serif text-3xl font-medium text-foreground md:text-4xl">
            Shelves
          </h1>
          <p className="mt-3 text-muted-foreground">
            Writings are organized by shelf rather than by feed. Pick one to wander down its
            row of spines.
          </p>
        </div>
        <Link
          href="/atlas"
          className="inline-flex w-fit items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          <Map className="h-4 w-4" aria-hidden="true" />
          Atlas
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shelves.map((shelf) => (
          <ShelfCard key={shelf.id} shelf={shelf} count={shelfCounts[shelf.id] ?? 0} />
        ))}
      </div>

      {shelves.length === 0 && (
        <p className="text-muted-foreground">No shelves have been added yet.</p>
      )}
    </div>
  );
}
