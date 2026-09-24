import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Section({
  title,
  subtitle,
  href,
  hrefLabel,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('px-4 py-8 sm:py-10 md:px-8', className)}>
      <div className="mx-auto max-w-shelf">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-medium text-foreground sm:text-2xl">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {href && (
            <Link
              href={href}
              className="whitespace-nowrap text-sm text-accent transition-opacity hover:opacity-75"
            >
              {hrefLabel ?? 'See all'} →
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
