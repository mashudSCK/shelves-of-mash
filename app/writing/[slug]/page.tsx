import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { TagBadge } from '@/components/writing/tag-badge';
import { TableOfContents } from '@/components/writing/table-of-contents';
import { ShelfMark } from '@/components/writing/shelf-mark';
import { BookmarkButton } from '@/components/writing/bookmark-button';
import { ShareButton } from '@/components/writing/share-button';
import { AiSummaryCard } from '@/components/writing/ai-summary-card';
import { ViewTracker } from '@/components/writing/view-tracker';
import { WritingCard } from '@/components/writing/writing-card';
import { Section } from '@/components/layout/section';
import { renderMarkdown } from '@/lib/markdown';
import { formatPublishedDate, formatReadingTime } from '@/lib/format';
import {
  getWritingBySlug,
  getRelatedWritings,
  getAiSummary,
  getBookmarkStatus,
} from '@/lib/data/writings';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 120;

type WritingPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: WritingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const writing = await getWritingBySlug(slug);
  if (!writing) return {};

  return {
    title: writing.title,
    description: writing.subtitle ?? undefined,
    openGraph: {
      title: writing.title,
      description: writing.subtitle ?? undefined,
      images: writing.cover_image_url ? [writing.cover_image_url] : undefined,
      type: 'article',
      publishedTime: writing.published_at ?? undefined,
    },
  };
}

export default async function WritingPage({ params }: WritingPageProps) {
  const { slug } = await params;
  const writing = await getWritingBySlug(slug);
  if (!writing) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [related, aiSummary, bookmarked] = await Promise.all([
    getRelatedWritings(writing.id, writing.shelf_id),
    getAiSummary(writing.id),
    getBookmarkStatus(writing.id),
  ]);

  const { html, toc } = renderMarkdown(writing.content);
  const shareUrl = `https://shelvesofmash.com/writing/${writing.slug}`;

  return (
    <article className="animate-fade-settle">
      <ViewTracker writingId={writing.id} />
      {writing.cover_image_url && (
        <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-[21/9]">
          <Image
            src={writing.cover_image_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="mx-auto max-w-shelf px-4 py-8 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_min(42rem,100%)_1fr]">
          {/* Left rail: shelf mark, desktop only */}
          <div className="hidden justify-end lg:flex">
            <ShelfMark shelfName={writing.shelf.name} publishedAt={writing.published_at} />
          </div>

          {/* Center: the writing itself */}
          <div className="mx-auto w-full">
            <header className="mb-8">
              <a
                href={`/shelves/${writing.shelf.slug}`}
                className="text-2xs uppercase tracking-widest2 text-accent"
              >
                {writing.shelf.name}
              </a>
              <h1 className="mt-3 break-words font-serif text-2xl font-medium leading-tight text-foreground sm:text-3xl md:text-4xl">
                {writing.title}
              </h1>
              {writing.subtitle && (
                <p className="mt-3 font-serif text-lg italic text-muted-foreground">
                  {writing.subtitle}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{formatPublishedDate(writing.published_at)}</span>
                <span aria-hidden="true">·</span>
                <span>{formatReadingTime(writing.reading_time_minutes)}</span>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <BookmarkButton
                  writingId={writing.id}
                  initialBookmarked={bookmarked}
                  isAuthenticated={!!user}
                />
                <ShareButton title={writing.title} url={shareUrl} />
              </div>

              {writing.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {writing.tags.map((tag) => (
                    <TagBadge key={tag.id} name={tag.name} slug={tag.slug} />
                  ))}
                </div>
              )}
            </header>

            {/* TOC inline on mobile/tablet, before content */}
            {toc.length > 1 && (
              <div className="mb-8 rounded-md border border-border bg-surface p-4 lg:hidden">
                <TableOfContents items={toc} />
              </div>
            )}

            <div className="prose-shelf">{html}</div>

            <div className="mt-10">
              <AiSummaryCard summary={aiSummary} />
            </div>
          </div>

          {/* Right rail: sticky TOC, desktop only */}
          <div className="hidden lg:block">
            {toc.length > 1 && (
              <div className="sticky top-24">
                <TableOfContents items={toc} />
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <Section title="Related Writings" subtitle={`More from ${writing.shelf.name}`}>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((w) => (
              <WritingCard key={w.id} writing={w} />
            ))}
          </div>
        </Section>
      )}
    </article>
  );
}
