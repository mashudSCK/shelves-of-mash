import type { Metadata } from 'next';
import { AtlasGraph } from '@/components/atlas/atlas-graph';
import { getAtlasData } from '@/lib/data/atlas';

export const metadata: Metadata = {
  title: 'Atlas',
  description: 'Explore the relationships between shelves, writings, and themes.',
};

export const revalidate = 300;

export default async function AtlasPage() {
  const { nodes, edges } = await getAtlasData();

  return (
    <div className="mx-auto max-w-shelf px-4 py-8 md:px-8 md:py-10">
      <header className="mb-8 max-w-prose">
        <p className="text-2xs uppercase tracking-widest2 text-accent">Knowledge map</p>
        <h1 className="mt-2 font-serif text-3xl font-medium text-foreground md:text-4xl">Atlas</h1>
        <p className="mt-3 text-muted-foreground">
          Follow the paths between shelves, writings, and recurring themes.
        </p>
      </header>
      {nodes.length > 0 ? (
        <AtlasGraph nodes={nodes} edges={edges} />
      ) : (
        <p className="text-muted-foreground">The atlas will appear as writings and tags are published.</p>
      )}
    </div>
  );
}
