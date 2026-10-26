import { createPublicClient } from '@/lib/supabase/public';
import { publicRead } from '@/lib/data/public-cache';

export type AtlasNode = {
  id: string;
  label: string;
  kind: 'shelf' | 'writing' | 'tag';
  href: string;
  connections: number;
};

export type AtlasEdge = { source: string; target: string };

export const getAtlasData = publicRead('atlas', async (): Promise<{ nodes: AtlasNode[]; edges: AtlasEdge[] }> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('writings')
    .select('id, slug, title, shelf:shelves(id, slug, name), tags:writing_tags(tag:tags(id, slug, name))')
    .eq('status', 'published')
    .order('published_at', { ascending: false }).order('id', { ascending: false })
    .limit(30);

  if (error) throw error;

  const nodes = new Map<string, AtlasNode>();
  const edges: AtlasEdge[] = [];

  const addNode = (node: Omit<AtlasNode, 'connections'>) => {
    if (!nodes.has(node.id)) nodes.set(node.id, { ...node, connections: 0 });
  };
  const addEdge = (source: string, target: string) => {
    edges.push({ source, target });
    const sourceNode = nodes.get(source);
    const targetNode = nodes.get(target);
    if (sourceNode) sourceNode.connections++;
    if (targetNode) targetNode.connections++;
  };

  for (const row of (data ?? []) as any[]) {
    const writingId = `writing:${row.id}`;
    addNode({ id: writingId, label: row.title, kind: 'writing', href: `/writing/${row.slug}` });

    if (row.shelf) {
      const shelfId = `shelf:${row.shelf.id}`;
      addNode({ id: shelfId, label: row.shelf.name, kind: 'shelf', href: `/shelves/${row.shelf.slug}` });
      addEdge(shelfId, writingId);
    }

    for (const relation of row.tags ?? []) {
      const tag = relation.tag;
      if (!tag) continue;
      const tagId = `tag:${tag.id}`;
      addNode({ id: tagId, label: tag.name, kind: 'tag', href: `/search?tag=${tag.slug}` });
      addEdge(writingId, tagId);
    }
  }

  return { nodes: Array.from(nodes.values()), edges };
});
