import Link from 'next/link';
import Image from 'next/image';
import { BookMarked } from 'lucide-react';
import type { WritingCardData } from '@/types/database';
import { formatPublishedDate, formatReadingTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export function WritingCard({
  writing,
  className,
  priority = false,
}: {
  writing: WritingCardData;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/writing/${writing.slug}`}
      className={cn(
        'group flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-surface transition-all hover:border-accent/60 hover:shadow-card',
        className
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {writing.cover_image_url ? (
          <Image
            src={writing.cover_image_url}
            alt=""
            fill
            loading={priority ? 'eager' : 'lazy'}
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 ease-settle group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookMarked className="h-7 w-7 text-border" strokeWidth={1.25} aria-hidden="true" />
          </div>
        )}
        {writing.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-0.5 text-2xs uppercase tracking-widest2 text-accent-foreground">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-2xs uppercase tracking-widest2 text-accent">
          {writing.shelf.name}
        </span>
        <h3 className="break-words font-serif text-lg font-medium leading-snug text-foreground group-hover:text-accent">
          {writing.title}
        </h3>
        {writing.subtitle && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{writing.subtitle}</p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2 text-2xs text-muted-foreground">
          <span>{formatPublishedDate(writing.published_at)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatReadingTime(writing.reading_time_minutes)}</span>
        </div>
      </div>
    </Link>
  );
}
