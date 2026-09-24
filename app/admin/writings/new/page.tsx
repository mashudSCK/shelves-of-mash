import { WritingForm } from '@/components/admin/writing-form';
import { createWriting } from '@/lib/actions/writings';
import { getShelves } from '@/lib/data/writings';

export default async function NewWritingPage() {
  const shelves = await getShelves();

  return (
    <div>
      <h2 className="mb-6 font-serif text-xl font-medium text-foreground">New writing</h2>
      <WritingForm action={createWriting} shelves={shelves} />
    </div>
  );
}
