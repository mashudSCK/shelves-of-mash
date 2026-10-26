'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  async function handleShare() {
    setMessage('');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        setMessage('Shared.');
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setMessage('Link copied.');
    } catch {
      setCopied(false);
      setMessage('Could not copy the link. Copy the page address from your browser.');
    }
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share this writing"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
    >
      {copied ? (
        <Check className="h-[18px] w-[18px]" strokeWidth={1.75} />
      ) : (
        <Share2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
      )}
    </button>
    <span role="status" className="max-w-56 text-sm text-muted-foreground">{message}</span>
    </div>
  );
}
