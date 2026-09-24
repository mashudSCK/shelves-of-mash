function callNumberFromDate(iso: string | null): string {
  if (!iso) return '000.00';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function ShelfMark({
  shelfName,
  publishedAt,
}: {
  shelfName: string;
  publishedAt: string | null;
}) {
  return (
    <div
      aria-hidden="true"
      className="hidden select-none flex-col items-center gap-1 font-mono text-2xs uppercase tracking-widest2 text-muted-foreground/70 lg:flex"
    >
      <span className="h-10 w-px bg-border" />
      <span>{shelfName.slice(0, 3).toUpperCase()}</span>
      <span>{callNumberFromDate(publishedAt)}</span>
      <span className="h-10 w-px bg-border" />
    </div>
  );
}
