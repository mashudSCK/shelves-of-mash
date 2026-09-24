import type { Metadata } from 'next';
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
      <header className="mb-8 max-w-prose">
        <p className="text-2xs uppercase tracking-widest2 text-accent">The library</p>
        <h1 className="mt-2 font-serif text-3xl font-medium text-foreground md:text-4xl">
          Shelves
        </h1>
        <p className="mt-3 text-muted-foreground">
          Writings are organized by shelf rather than by feed. Pick one to wander down its
          row of spines.
        </p>
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
