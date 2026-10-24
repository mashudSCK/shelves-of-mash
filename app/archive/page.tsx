import type { Metadata } from 'next';
import { ArchiveFilters } from '@/components/layout/archive-filters';
import { Pagination } from '@/components/layout/pagination';
import { WritingCard } from '@/components/writing/writing-card';
import { getArchiveWritings, getArchiveYears, getShelves } from '@/lib/data/writings';
import { parsePage, PUBLIC_PAGE_SIZE } from '@/lib/pagination';

export const metadata: Metadata = {
  title: 'Archive',
  description: 'A chronological archive of every published writing.',
};

export const revalidate = 120;

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string | string[]; shelf?: string | string[]; tag?: string | string[]; page?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parsePage(resolvedSearchParams.page);
  const filters = {
    year: typeof resolvedSearchParams.year === 'string' ? resolvedSearchParams.year : undefined,
    shelf: typeof resolvedSearchParams.shelf === 'string' ? resolvedSearchParams.shelf : undefined,
    tag: typeof resolvedSearchParams.tag === 'string' ? resolvedSearchParams.tag : undefined,
  };

  const [{ writings, total }, years, shelves] = await Promise.all([
    getArchiveWritings({
      ...filters,
      page,
      pageSize: PUBLIC_PAGE_SIZE,
    }),
    getArchiveYears(),
    getShelves(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PUBLIC_PAGE_SIZE));

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
        <p className="text-muted-foreground">{page > 1 ? 'No writings on this page match these filters.' : 'No writings match these filters.'}</p>
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
        searchParams={filters}
      />
    </div>
  );
}
