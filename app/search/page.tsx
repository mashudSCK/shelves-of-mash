import type { Metadata } from 'next';
import { Search as SearchIcon } from 'lucide-react';
import { WritingCard } from '@/components/writing/writing-card';
import { getWritingsByTag, searchWritings } from '@/lib/data/writings';
import { Pagination } from '@/components/layout/pagination';
import { parsePage, PUBLIC_PAGE_SIZE } from '@/lib/pagination';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search the archive of writings.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; tag?: string | string[]; page?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim() : '';
  const tag = typeof params.tag === 'string' ? params.tag : undefined;
  const page = parsePage(params.page);
  const { writings: results, total } = query
    ? await searchWritings(query, page)
    : tag
      ? await getWritingsByTag(tag, page)
      : { writings: [], total: 0 };

  return (
    <div className="mx-auto max-w-shelf px-4 py-10 md:px-8">
      <header className="mb-8 max-w-prose">
        <p className="text-2xs uppercase tracking-widest2 text-accent">Find a thought</p>
        <h1 className="mt-2 font-serif text-3xl font-medium text-foreground md:text-4xl">
          Search
        </h1>
        <p className="mt-3 text-muted-foreground">
          Try a phrase like &ldquo;reflections about society&rdquo; or &ldquo;identity&rdquo;.
        </p>
      </header>

      <form action="/search" method="get" className="mb-8">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search writings..."
            autoFocus
            className="w-full rounded-md border border-border bg-surface py-3 pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-accent"
          />
        </div>
      </form>

      {(query || tag) && (
        <p className="mb-6 text-sm text-muted-foreground">
          {total} {total === 1 ? 'result' : 'results'} for{' '}
          {query ? <>&ldquo;{query}&rdquo;</> : <>tag #{tag}</>}
        </p>
      )}

      {(query || tag) && results.length === 0 && (
        <p className="text-muted-foreground">
          {page > 1 ? 'No results on this page. Try a previous page.' : 'Nothing on the shelves matches that yet. Try a different word or phrase.'}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((w, index) => (
          <WritingCard key={w.id} writing={w} priority={index === 0} />
        ))}
      </div>
      {(query || tag) && <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / PUBLIC_PAGE_SIZE))} basePath="/search" searchParams={{ q: query, tag }} />}
    </div>
  );
}
