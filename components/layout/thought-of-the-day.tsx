import Link from 'next/link';
import { Quote } from 'lucide-react';
import type { WritingCardData } from '@/types/database';

export function ThoughtOfTheDay({ writing }: { writing: WritingCardData | null }) {
  if (!writing) return null;

  return (
    <section className="px-4 py-10 md:px-8">
      <div className="mx-auto max-w-shelf">
        <Link
          href={`/writing/${writing.slug}`}
          className="group block rounded-md border border-border bg-walnut/[0.04] p-6 transition-colors hover:border-accent/60 dark:bg-gold/[0.04] md:p-8"
        >
          <div className="flex items-start gap-4">
            <Quote className="mt-1 h-5 w-5 shrink-0 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="text-2xs uppercase tracking-widest2 text-accent">Thought of the day</p>
              <h3 className="mt-2 font-serif text-xl font-medium text-foreground group-hover:text-accent md:text-2xl">
                {writing.title}
              </h3>
              {writing.subtitle && (
                <p className="mt-2 max-w-prose text-sm text-muted-foreground">{writing.subtitle}</p>
              )}
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
