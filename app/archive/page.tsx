import type { Metadata } from 'next';
import { ArchiveFilters } from '@/components/layout/archive-filters';
import { Pagination } from '@/components/layout/pagination';
import { WritingCard } from '@/components/writing/writing-card';
import { getArchiveWritings, getArchiveYears, getShelves } from '@/lib/data/writings';

export const metadata: Metadata = {
  title: 'Archive',
  description: 'A chronological archive of every published writing.',
};

export const revalidate = 120;

const PAGE_SIZE = 12;

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; shelf?: string; tag?: string; page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams.page ?? '1') || 1);

  const [{ writings, total }, years, shelves] = await Promise.all([
    getArchiveWritings({
      year: resolvedSearchParams.year,
      shelf: resolvedSearchParams.shelf,
      tag: resolvedSearchParams.tag,
      page,
      pageSize: PAGE_SIZE,
    }),
    getArchiveYears(),
    getShelves(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-shelf px-4 py-10 md:px-8">
      <header className="mb-8 max-w-prose">
        <p className="text-2xs uppercase tracking-widest2 text-accent">Chronological</p>
        <h1 className="mt-2 font-serif text-3xl font-medium text-foreground md:text-4xl">
          Archive
        </h1>
        <p className="mt-3 text-muted-foreground">
          Every writing, in the order it was added to the library.
        </p>
      </header>

      <div className="mb-8">
        <ArchiveFilters years={years} shelves={shelves} />
      </div>

      {writings.length === 0 ? (
        <p className="text-muted-foreground">No writings match these filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {writings.map((w, index) => (
            <WritingCard key={w.id} writing={w} priority={index === 0} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/archive"
        searchParams={resolvedSearchParams}
      />
    </div>
  );
}
