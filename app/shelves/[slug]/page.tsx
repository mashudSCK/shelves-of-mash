import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SpineShelfRow } from '@/components/shelves/spine';
import { WritingCard } from '@/components/writing/writing-card';
import { getShelfBySlug, getWritingsByShelf } from '@/lib/data/writings';
import { Pagination } from '@/components/layout/pagination';
import { parsePage, PUBLIC_PAGE_SIZE } from '@/lib/pagination';

export const dynamic = 'force-dynamic';

type ShelfPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: ShelfPageProps): Promise<Metadata> {
  const { slug } = await params;
  const shelf = await getShelfBySlug(slug);
  if (!shelf) return {};
  return {
    title: shelf.name,
    description: shelf.description ?? `Writings shelved under ${shelf.name}.`,
  };
}

export default async function ShelfPage({ params, searchParams }: ShelfPageProps) {
  const { slug } = await params;
  const shelf = await getShelfBySlug(slug);
  if (!shelf) notFound();

  const page = parsePage((await searchParams).page);
  const { writings, total } = await getWritingsByShelf(slug, page);

  return (
    <div className="mx-auto max-w-shelf px-4 py-10 md:px-8">
      <header className="mb-8 max-w-prose">
        <p className="text-2xs uppercase tracking-widest2 text-accent">Shelf</p>
        <h1 className="mt-2 font-serif text-3xl font-medium text-foreground md:text-4xl">
          {shelf.name}
        </h1>
        {shelf.description && (
          <p className="mt-3 text-muted-foreground">{shelf.description}</p>
        )}
        <p className="mt-2 text-2xs uppercase tracking-widest2 text-muted-foreground">
          {total} {total === 1 ? 'writing' : 'writings'}
        </p>
      </header>

      {writings.length === 0 ? (
        <p className="text-muted-foreground">
          {page > 1 ? 'No writings on this page.' : 'This shelf is empty for now — come back soon.'}
        </p>
      ) : (
        <>
          <div className="mb-10">
            <SpineShelfRow writings={writings} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {writings.map((w, index) => (
              <WritingCard key={w.id} writing={w} priority={index === 0} />
            ))}
          </div>
        </>
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / PUBLIC_PAGE_SIZE))} basePath={`/shelves/${slug}`} searchParams={{}} />
    </div>
  );
}
