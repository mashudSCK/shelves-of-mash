import { notFound } from 'next/navigation';
import { WritingForm } from '@/components/admin/writing-form';
import { updateWriting } from '@/lib/actions/writings';
import { getShelves } from '@/lib/data/writings';
import { getWritingByIdForEdit } from '@/lib/data/admin';

export default async function EditWritingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [writing, shelves] = await Promise.all([
    getWritingByIdForEdit(id),
    getShelves(),
  ]);

  if (!writing) notFound();

  const boundUpdate = updateWriting.bind(null, id);

  return (
    <div>
      <h2 className="mb-6 font-serif text-xl font-medium text-foreground">Edit writing</h2>
      <WritingForm action={boundUpdate} shelves={shelves} initial={writing} />
    </div>
  );
}
