'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-2xs uppercase tracking-widest2 text-accent">Something went wrong</p>
      <h1 className="mt-3 font-serif text-3xl font-medium text-foreground">The shelf could not be opened</h1>
      <p className="mt-3 text-muted-foreground">The problem has been logged. You can try loading this view again.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}
