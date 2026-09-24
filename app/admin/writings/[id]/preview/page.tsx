import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/require-admin';
import { getWritingByIdForEdit } from '@/lib/data/admin';
import { renderMarkdown } from '@/lib/markdown';

export default async function PreviewWritingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const writing = await getWritingByIdForEdit(id);
  if (!writing) notFound();

  const { html } = renderMarkdown(writing.content);

  return (
    <article className="mx-auto max-w-prose">
      <Link
        href={`/admin/writings/${id}/edit`}
        className="mb-8 inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to editor
      </Link>
      <p className="text-2xs uppercase tracking-widest2 text-accent">Private preview</p>
      <h1 className="mt-2 break-words font-serif text-3xl font-medium leading-tight text-foreground sm:text-4xl">
        {writing.title}
      </h1>
      {writing.subtitle && (
        <p className="mt-3 font-serif text-lg italic text-muted-foreground">{writing.subtitle}</p>
      )}
      <div className="prose-shelf mt-8">{html}</div>
    </article>
  );
}
