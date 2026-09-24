import { BookOpenCheck } from 'lucide-react';

export function AiSummaryCard({ summary }: { summary: string | null }) {
  if (!summary) return null;

  return (
    <aside className="rounded-md border border-dashed border-border bg-surface p-5">
      <div className="mb-2 flex items-center gap-2 text-2xs uppercase tracking-widest2 text-muted-foreground">
        <BookOpenCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        <span>Librarian&rsquo;s note</span>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
    </aside>
  );
}
