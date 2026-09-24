import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { ConfirmSubmitButton } from '@/components/admin/confirm-submit-button';
import { getWritingsByStatus } from '@/lib/data/admin';
import { archiveWriting, deleteWriting, restoreWriting } from '@/lib/actions/writings';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { WritingStatus } from '@/types/database';

const TABS: { key: WritingStatus; label: string }[] = [
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
  { key: 'archived', label: 'Archived' },
  { key: 'scheduled', label: 'Scheduled' },
];

export default async function AdminWritingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; saved?: string; error?: string }>;
}) {
  const { status: requestedStatus, saved, error } = await searchParams;
  const status = TABS.some((tab) => tab.key === requestedStatus)
    ? (requestedStatus as WritingStatus)
    : 'published';
  const writings = await getWritingsByStatus(status);

  return (
    <div>
      <header className="mb-6">
        <p className="text-2xs uppercase tracking-widest2 text-accent">Library</p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-foreground">Writings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review drafts, published work, and archived pieces.
        </p>
      </header>

      {(saved === 'created' || saved === 'updated' || saved === 'deleted') && (
        <div role="status" className="mb-5 flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Writing {saved} successfully.
        </div>
      )}
      {error === 'delete_failed' && (
        <p role="alert" className="mb-5 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          The writing could not be deleted. Please try again.
        </p>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid w-full grid-cols-2 gap-1 rounded-md border border-border p-1 sm:w-auto sm:grid-cols-4">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/writings?status=${tab.key}`}
              className={cn(
                'min-w-0 rounded-sm px-2 py-2 text-center text-sm transition-colors sm:px-3 sm:py-1.5',
                status === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <Link
          href="/admin/writings/new"
          className="hidden min-h-10 items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground md:inline-flex"
        >
          New writing
        </Link>
      </div>

      {writings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No writings here yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border bg-surface">
          {writings.map((w) => (
            <li key={w.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link
                  href={`/admin/writings/${w.id}/edit`}
                  className="break-words font-serif text-base font-medium text-foreground hover:text-accent"
                >
                  {w.title}
                </Link>
                <p className="text-2xs text-muted-foreground">
                  Updated {formatRelative(w.updated_at)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-t border-border/70 pt-2 sm:shrink-0 sm:border-0 sm:pt-0">
                {status === 'published' && (
                  <Link
                    href={`/writing/${w.slug}`}
                    className="flex min-h-9 items-center px-2 text-2xs uppercase tracking-widest2 text-muted-foreground hover:text-accent"
                  >
                    View
                  </Link>
                )}
                <Link
                  href={`/admin/writings/${w.id}/edit`}
                  className="flex min-h-9 items-center px-2 text-2xs uppercase tracking-widest2 text-muted-foreground hover:text-accent"
                >
                  Edit
                </Link>
                {status === 'archived' ? (
                  <form action={restoreWriting.bind(null, w.id)}>
                    <button className="min-h-9 px-2 text-2xs uppercase tracking-widest2 text-muted-foreground hover:text-accent">
                      Restore
                    </button>
                  </form>
                ) : (
                  <form action={archiveWriting.bind(null, w.id)}>
                    <button className="min-h-9 px-2 text-2xs uppercase tracking-widest2 text-muted-foreground hover:text-accent">
                      Archive
                    </button>
                  </form>
                )}
                <form action={deleteWriting.bind(null, w.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`Permanently delete “${w.title}”? This cannot be undone.`}
                    className="min-h-9 px-2 text-2xs uppercase tracking-widest2 text-muted-foreground hover:text-red-500"
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
