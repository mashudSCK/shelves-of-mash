import type { Metadata } from 'next';
import Link from 'next/link';
import { Hero } from '@/components/layout/hero';
import { Section } from '@/components/layout/section';
import { ThoughtOfTheDay } from '@/components/layout/thought-of-the-day';
import { WritingCard } from '@/components/writing/writing-card';
import { ShelfCard } from '@/components/shelves/shelf-card';
import {
  getFeaturedWritings,
  getRecentWritings,
  getThoughtOfTheDay,
  getPopularWritings,
  getShelves,
  getShelfCounts,
} from '@/lib/data/writings';

export const metadata: Metadata = {
  title: 'The Shelves of Mash',
};

export const revalidate = 300; // ISR: refresh the library every 5 minutes

export default async function HomePage() {
  const [featured, recent, thought, popular, shelves, shelfCounts] = await Promise.all([
    getFeaturedWritings(4),
    getRecentWritings(6),
    getThoughtOfTheDay(),
    getPopularWritings(4),
    getShelves(),
    getShelfCounts(),
  ]);

  return (
    <>
      <Hero />

      <ThoughtOfTheDay writing={thought} />

      {featured.length > 0 && (
        <Section title="Featured Writing" subtitle="Pinned by Mash">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((w, index) => (
              <WritingCard key={w.id} writing={w} priority={index === 0} />
            ))}
          </div>
        </Section>
      )}

      {recent.length > 0 && (
        <Section title="Recent Additions" href="/archive" hrefLabel="View archive">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((w) => (
              <WritingCard key={w.id} writing={w} />
            ))}
          </div>
        </Section>
      )}

      {shelves.length > 0 && (
        <Section title="Explore by Shelf" href="/shelves" hrefLabel="All shelves">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shelves.slice(0, 6).map((shelf) => (
              <ShelfCard key={shelf.id} shelf={shelf} count={shelfCounts[shelf.id] ?? 0} />
            ))}
          </div>
        </Section>
      )}

      {popular.length > 0 && (
        <Section title="Popular Writings" subtitle="Most read by visitors">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((w) => (
              <WritingCard key={w.id} writing={w} />
            ))}
          </div>
        </Section>
      )}

      <section className="px-4 py-12 text-center md:px-8">
        <Link
          href="/shelves"
          className="font-serif text-lg italic text-muted-foreground transition-colors hover:text-accent"
        >
          Wander further into the library →
        </Link>
      </section>
    </>
  );
}
