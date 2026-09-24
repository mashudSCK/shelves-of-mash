'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { Eye, Upload } from 'lucide-react';
import type { Shelf, Tag, Writing } from '@/types/database';
import type { WritingFormState } from '@/lib/actions/writings';

export function WritingForm({
  action,
  shelves,
  initial,
}: {
  action: (state: WritingFormState, formData: FormData) => Promise<WritingFormState>;
  shelves: Shelf[];
  initial?: Partial<Writing> & { tags?: Tag[] };
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [status, setStatus] = useState(initial?.status ?? 'draft');
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.cover_image_url ?? null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty || isPending) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [dirty, isPending]);

  function handleCoverChange(file?: File) {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setDirty(true);
  }

  return (
    <form
      action={formAction}
      className="w-full max-w-2xl space-y-5"
      onChange={() => setDirty(true)}
    >
      {state?.error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm text-foreground">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={initial?.title ?? ''}
          className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-base text-foreground focus-visible:border-accent"
        />
      </div>

      <div>
        <label htmlFor="slug" className="mb-1.5 block text-sm text-foreground">
          URL slug
        </label>
        <div className="flex overflow-hidden rounded-md border border-border bg-surface focus-within:border-accent">
          <span className="hidden items-center border-r border-border bg-muted px-3 text-sm text-muted-foreground sm:flex">
            /writing/
          </span>
          <input
            id="slug"
            name="slug"
            defaultValue={initial?.slug ?? ''}
            placeholder="generated-from-title"
            aria-invalid={Boolean(state?.fieldErrors?.slug)}
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-base text-foreground outline-none"
          />
        </div>
        {state?.fieldErrors?.slug && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.fieldErrors.slug}</p>
        )}
      </div>

      <div>
        <label htmlFor="subtitle" className="mb-1.5 block text-sm text-foreground">
          Subtitle
        </label>
        <input
          id="subtitle"
          name="subtitle"
          defaultValue={initial?.subtitle ?? ''}
          className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-base text-foreground focus-visible:border-accent"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="shelf_id" className="mb-1.5 block text-sm text-foreground">
            Shelf
          </label>
          <select
            id="shelf_id"
            name="shelf_id"
            required
            defaultValue={initial?.shelf_id ?? ''}
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-base text-foreground focus-visible:border-accent"
          >
            <option value="" disabled>
              Choose a shelf
            </option>
            {shelves.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="mb-1.5 block text-sm text-foreground">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initial?.status ?? 'draft'}
            onChange={(event) => setStatus(event.target.value as Writing['status'])}
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-base text-foreground focus-visible:border-accent"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {status === 'scheduled' && (
        <div>
          <label htmlFor="scheduled_for" className="mb-1.5 block text-sm text-foreground">
            Publish date and time
          </label>
          <input
            id="scheduled_for"
            name="scheduled_for"
            type="datetime-local"
            required
            defaultValue={initial?.scheduled_for ? initial.scheduled_for.slice(0, 16) : ''}
            aria-invalid={Boolean(state?.fieldErrors?.schedule)}
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-base text-foreground focus-visible:border-accent"
          />
          {state?.fieldErrors?.schedule && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.fieldErrors.schedule}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="cover_image" className="mb-1.5 block text-sm text-foreground">
          Cover image
        </label>
        <input type="hidden" name="existing_cover_url" value={initial?.cover_image_url ?? ''} />
        {previewUrl && (
          <div className="relative mb-3 aspect-[16/9] max-w-md overflow-hidden rounded-md border border-border bg-muted">
            <Image src={previewUrl} alt="Cover preview" fill sizes="448px" className="object-cover" unoptimized={previewUrl.startsWith('blob:')} />
          </div>
        )}
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-foreground">
          <Upload className="h-4 w-4" aria-hidden="true" />
          Choose image
          <input
            id="cover_image"
            name="cover_image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(event) => handleCoverChange(event.target.files?.[0])}
          />
        </label>
        <p className="mt-1.5 text-2xs text-muted-foreground">JPEG, PNG, WebP, or AVIF. Maximum 5 MB.</p>
        {initial?.cover_image_url && (
          <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              name="remove_cover"
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-accent"
              onChange={(event) => setPreviewUrl(event.target.checked ? null : initial.cover_image_url ?? null)}
            />
            Remove current cover
          </label>
        )}
      </div>

      <div>
        <label htmlFor="tags" className="mb-1.5 block text-sm text-foreground">
          Tags (comma separated)
        </label>
        <input
          id="tags"
          name="tags"
          defaultValue={initial?.tags?.map((t) => t.name).join(', ') ?? ''}
          placeholder="identity, memory, place"
          className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-base text-foreground focus-visible:border-accent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_featured"
          name="is_featured"
          type="checkbox"
          defaultChecked={initial?.is_featured ?? false}
          className="h-4 w-4 rounded border-border accent-accent"
        />
        <label htmlFor="is_featured" className="text-sm text-foreground">
          Pin as featured
        </label>
      </div>

      <div>
        <label htmlFor="content" className="mb-1.5 block text-sm text-foreground">
          Content (Markdown)
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={18}
          defaultValue={initial?.content ?? ''}
          className="min-h-72 w-full resize-y rounded-md border border-border bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground focus-visible:border-accent sm:min-h-96"
        />
        <p className="mt-1.5 text-2xs text-muted-foreground">
          Supports ## and ### headings, **bold**, *italic*, &gt; blockquotes, - lists, and [links](url).
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 w-full rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending ? 'Saving...' : 'Save writing'}
        </button>
        {initial?.id && (
          <Link
            href={`/admin/writings/${initial.id}/preview`}
            className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm text-foreground hover:border-accent"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Preview saved draft
          </Link>
        )}
      </div>
    </form>
  );
}
