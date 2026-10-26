'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const POSITION_KEY = 'shelves-reading-progress';
const SIZE_KEY = 'shelves-reading-size';
type Position = { slug: string; fraction: number };

function positions(): Position[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(POSITION_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((entry): entry is Position =>
      typeof entry?.slug === 'string' && Number.isFinite(entry.fraction) && entry.fraction > 0 && entry.fraction < 1,
    ).slice(0, 50) : [];
  } catch { return []; }
}

export function ReadingTools({ slug, children }: { slug: string; children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(18);
  const [progress, setProgress] = useState(0);
  const [resume, setResume] = useState<number | null>(null);

  useEffect(() => {
    // Restoring a reading position always requires the reader's choice.
    history.scrollRestoration = 'manual';
    const saved = positions().find((entry) => entry.slug === slug);
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastSaved = 0;
    const initialize = requestAnimationFrame(() => {
      setResume(saved?.fraction ?? null);
      try {
        const savedSize = Number(localStorage.getItem(SIZE_KEY));
        if ([18, 20, 22].includes(savedSize)) setSize(savedSize);
      } catch { /* Reading remains available without device storage. */ }
      update(false);
    });
    function update(persist: boolean) {
      const element = content.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const available = rect.height - window.innerHeight;
      const fraction = available > 0 ? Math.min(1, Math.max(0, -rect.top / available)) : rect.bottom <= window.innerHeight ? 1 : 0;
      setProgress(Math.round(fraction * 100));
      if (!persist) return;
      try {
        const entries = positions().filter((entry) => entry.slug !== slug);
        if (fraction > 0.02 && fraction < 0.98) entries.unshift({ slug, fraction });
        localStorage.setItem(POSITION_KEY, JSON.stringify(entries.slice(0, 50)));
      } catch { /* Storage can be disabled or full. */ }
      lastSaved = Date.now();
    }
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update(Date.now() - lastSaved >= 500);
        clearTimeout(timer);
        timer = setTimeout(() => update(true), 500);
      });
    }
    function onResize() { update(false); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(initialize);
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [slug]);

  function chooseSize(next: number) {
    setSize(next);
    try { localStorage.setItem(SIZE_KEY, String(next)); } catch { /* Optional device preference. */ }
  }

  function continueReading() {
    const element = content.current;
    if (!element || resume === null) return;
    const top = window.scrollY + element.getBoundingClientRect().top;
    window.scrollTo({ top: top + resume * Math.max(0, element.clientHeight - window.innerHeight), behavior: 'instant' });
    setResume(null);
  }

  return (
    <>
      <div className="mb-7 border-y border-border py-2 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span className="tabular-nums">{progress}% read</span>
          <details>
            <summary className="cursor-pointer py-3">Reading settings</summary>
            <div className="flex items-center gap-1 pb-2" role="group" aria-label="Reading text size">
              {[18, 20, 22].map((value) => (
                <button key={value} type="button" aria-label={`Text size ${value} pixels`} aria-pressed={size === value}
                  onClick={() => chooseSize(value)}
                  className="min-h-11 min-w-11 rounded-sm px-2 text-foreground aria-pressed:bg-muted aria-pressed:font-semibold">
                  {value}
                </button>
              ))}
            </div>
            <p className="pb-2 text-xs">Saved only on this device.</p>
          </details>
        </div>
        <div role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}
          className="h-0.5 overflow-hidden bg-border">
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        {resume !== null && (
          <button type="button" onClick={continueReading} className="min-h-11 py-2 text-foreground underline underline-offset-4">
            Continue reading ({Math.round(resume * 100)}%)
          </button>
        )}
      </div>
      <div ref={content} id="writing-content" className="prose-shelf" style={{ fontSize: `${size}px` }}>{children}</div>
    </>
  );
}
