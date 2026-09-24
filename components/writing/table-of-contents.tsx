'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type TocItem = { id: string; text: string; level: 2 | 3 };

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="mb-3 text-2xs uppercase tracking-widest2 text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-2 border-l border-border">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: item.level === 3 ? '1.5rem' : '0.75rem' }}>
            <a
              href={`#${item.id}`}
              className={cn(
                '-ml-px block border-l-2 pl-3 transition-colors',
                activeId === item.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
