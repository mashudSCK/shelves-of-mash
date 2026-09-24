'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { AtlasEdge, AtlasNode } from '@/lib/data/atlas';
import { cn } from '@/lib/utils';

const WIDTH = 960;
const HEIGHT = 620;
const X_BY_KIND = { shelf: 120, writing: 480, tag: 840 } as const;

function positionsFor(nodes: AtlasNode[]) {
  const result = new Map<string, { x: number; y: number }>();
  for (const kind of ['shelf', 'writing', 'tag'] as const) {
    const group = nodes.filter((node) => node.kind === kind);
    group.forEach((node, index) => {
      result.set(node.id, {
        x: X_BY_KIND[kind],
        y: ((index + 1) * HEIGHT) / (group.length + 1),
      });
    });
  }
  return result;
}

export function AtlasGraph({ nodes, edges }: { nodes: AtlasNode[]; edges: AtlasEdge[] }) {
  const positions = useMemo(() => positionsFor(nodes), [nodes]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = nodes.find((node) => node.id === selectedId) ?? null;
  const neighbors = selected
    ? edges
        .filter((edge) => edge.source === selected.id || edge.target === selected.id)
        .map((edge) => nodes.find((node) => node.id === (edge.source === selected.id ? edge.target : edge.source)))
        .filter((node): node is AtlasNode => Boolean(node))
    : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="overflow-x-auto rounded-md border border-border bg-surface" aria-label="Relationship map">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[32rem] min-w-[52rem] w-full" role="img" aria-labelledby="atlas-title atlas-desc">
          <title id="atlas-title">Writing relationship atlas</title>
          <desc id="atlas-desc">Shelves connect to writings, and writings connect to their tags.</desc>
          {edges.map((edge) => {
            const source = positions.get(edge.source);
            const target = positions.get(edge.target);
            if (!source || !target) return null;
            const highlighted = selectedId === edge.source || selectedId === edge.target;
            return (
              <line
                key={`${edge.source}-${edge.target}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                className={highlighted ? 'stroke-accent' : 'stroke-border'}
                strokeWidth={highlighted ? 2 : 1}
              />
            );
          })}
          {nodes.map((node) => {
            const position = positions.get(node.id)!;
            const selectedNode = selectedId === node.id;
            return (
              <g
                key={node.id}
                transform={`translate(${position.x} ${position.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${node.kind}: ${node.label}, ${node.connections} connections`}
                onClick={() => setSelectedId(node.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setSelectedId(node.id);
                }}
                className="cursor-pointer outline-none"
              >
                <circle
                  r={node.kind === 'writing' ? 9 : 7}
                  className={cn(
                    'transition-colors',
                    selectedNode ? 'fill-accent' : node.kind === 'shelf' ? 'fill-primary' : node.kind === 'writing' ? 'fill-foreground' : 'fill-muted-foreground'
                  )}
                />
                <text
                  x={node.kind === 'tag' ? -14 : 14}
                  y="4"
                  textAnchor={node.kind === 'tag' ? 'end' : 'start'}
                  className="fill-foreground text-[12px]"
                >
                  {node.label.length > 24 ? `${node.label.slice(0, 23)}…` : node.label}
                </text>
              </g>
            );
          })}
          <text x="70" y="28" className="fill-muted-foreground text-[11px] uppercase">Shelves</text>
          <text x="445" y="28" className="fill-muted-foreground text-[11px] uppercase">Writings</text>
          <text x="815" y="28" className="fill-muted-foreground text-[11px] uppercase">Tags</text>
        </svg>
      </div>

      <aside className="rounded-md border border-border bg-surface p-5" aria-live="polite">
        {selected ? (
          <>
            <p className="text-2xs uppercase tracking-widest2 text-accent">{selected.kind}</p>
            <h2 className="mt-2 break-words font-serif text-xl font-medium text-foreground">{selected.label}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {selected.connections} {selected.connections === 1 ? 'connection' : 'connections'}
            </p>
            <Link href={selected.href} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm text-accent hover:underline">
              Open {selected.kind}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {neighbors.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h3 className="text-sm font-medium text-foreground">Connected to</h3>
                <ul className="mt-2 space-y-1">
                  {neighbors.map((node) => (
                    <li key={node.id}>
                      <button onClick={() => setSelectedId(node.id)} className="min-h-9 text-left text-sm text-muted-foreground hover:text-accent">
                        {node.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="font-serif text-lg font-medium text-foreground">Explore a connection</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Select any shelf, writing, or tag to inspect how ideas are connected.
            </p>
          </>
        )}
      </aside>
    </div>
  );
}
