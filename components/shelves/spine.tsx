import Link from 'next/link';
import type { WritingCardData } from '@/types/database';
import { formatReadingTime } from '@/lib/format';
import { cn } from '@/lib/utils';

// A small, deterministic palette of "binding" tints derived from the brand
// colors, varied by writing id so a shelf doesn't look uniform — like real
// books bound at different times in different runs.
const BINDING_TINTS = [
  'bg-walnut text-ivory',
  'bg-forest text-ivory',
  'bg-walnut-dark text-ivory',
  'bg-forest-dark text-ivory',
];

function tintForId(id: string) {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return BINDING_TINTS[sum % BINDING_TINTS.length];
}

export function Spine({ writing }: { writing: WritingCardData }) {
  const tint = tintForId(writing.id);

  return (
    <Link
      href={`/writing/${writing.slug}`}
      className={cn(
        'group relative flex h-56 w-14 shrink-0 flex-col justify-between rounded-sm px-2 py-4 shadow-spine transition-transform duration-300 ease-settle hover:-translate-y-1.5 focus-visible:-translate-y-1.5 sm:h-64 sm:w-16',
        tint
      )}
      title={writing.title}
    >
      <span className="text-2xs uppercase tracking-widest2 opacity-70">
        {writing.shelf.name.slice(0, 12)}
      </span>

      <span
        className="line-clamp-[7] font-serif text-sm font-medium leading-tight [writing-mode:vertical-rl]"
        style={{ textOrientation: 'mixed' }}
      >
        {writing.title}
      </span>

      <span className="text-2xs opacity-70">{formatReadingTime(writing.reading_time_minutes)}</span>

      {writing.is_featured && (
        <span
          aria-hidden="true"
          className="absolute -right-1 top-3 h-2 w-2 rounded-full bg-gold ring-2 ring-background"
        />
      )}
    </Link>
  );
}

export function SpineShelfRow({
  writings,
  label,
}: {
  writings: WritingCardData[];
  label?: string;
}) {
  if (writings.length === 0) return null;

  return (
    <div>
      {label && (
        <h3 className="mb-3 font-serif text-sm uppercase tracking-widest2 text-muted-foreground">
          {label}
        </h3>
      )}
      <div
        className="relative flex gap-2 overflow-x-auto pb-3 pt-1"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* The "shelf board" beneath the spines */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-2 h-2 rounded-sm bg-walnut/80 dark:bg-walnut-dark/60"
        />
        {writings.map((w) => (
          <div key={w.id} className="relative z-10">
            <Spine writing={w} />
          </div>
        ))}
      </div>
    </div>
  );
}
