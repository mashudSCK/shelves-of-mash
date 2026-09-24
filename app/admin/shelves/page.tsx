import { getShelves, getShelfCounts } from '@/lib/data/writings';
import { createShelf, deleteShelf } from '@/lib/actions/shelves';
import { ConfirmSubmitButton } from '@/components/admin/confirm-submit-button';
import { CheckCircle2, CircleAlert } from 'lucide-react';

export default async function AdminShelvesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const feedback = await searchParams;
  const [shelves, counts] = await Promise.all([getShelves(), getShelfCounts()]);

  return (
    <div className="w-full max-w-2xl space-y-8">
      {feedback.saved && (
        <p role="status" className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Shelf {feedback.saved} successfully.
        </p>
      )}
      {feedback.error && (
        <p role="alert" className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <CircleAlert className="h-4 w-4" aria-hidden="true" />
          {feedback.error === 'not_empty'
            ? 'Move or delete the writings on this shelf before deleting it.'
            : 'The shelf could not be changed. Its name may already be in use.'}
        </p>
      )}
      <div>
        <h2 className="mb-4 font-serif text-xl font-medium text-foreground">Shelves</h2>
        <ul className="divide-y divide-border rounded-md border border-border bg-surface">
          {shelves.map((shelf) => (
            <li key={shelf.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{shelf.name}</p>
                <p className="text-2xs text-muted-foreground">
                  {counts[shelf.id] ?? 0} writings
                </p>
              </div>
              <form action={deleteShelf.bind(null, shelf.id)}>
                <ConfirmSubmitButton
                  confirmMessage={`Delete the “${shelf.name}” shelf? Only empty shelves can be deleted.`}
                  className="min-h-10 px-2 text-2xs uppercase tracking-widest2 text-muted-foreground hover:text-red-500"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-4 font-serif text-xl font-medium text-foreground">Add a shelf</h2>
        <form action={createShelf} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm text-foreground">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-base text-foreground focus-visible:border-accent"
            />
          </div>
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm text-foreground">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-base text-foreground focus-visible:border-accent"
            />
          </div>
          <button
            type="submit"
            className="min-h-11 w-full rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground sm:w-auto"
          >
            Add shelf
          </button>
        </form>
      </div>
    </div>
  );
}
