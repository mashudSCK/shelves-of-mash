import Link from 'next/link';
import { cn } from '@/lib/utils';

export function TagBadge({
  name,
  slug,
  className,
}: {
  name: string;
  slug: string;
  className?: string;
}) {
  return (
    <Link
      href={`/search?tag=${slug}`}
      className={cn(
        'inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-2xs uppercase tracking-widest2 text-muted-foreground transition-colors hover:border-accent hover:text-accent',
        className
      )}
    >
      {name}
    </Link>
  );
}
