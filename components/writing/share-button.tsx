'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled the native share sheet — no action needed.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write blocked — silently no-op rather than show an alert.
    }
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Share this writing"
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
    >
      {copied ? (
        <Check className="h-[18px] w-[18px]" strokeWidth={1.75} />
      ) : (
        <Share2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
      )}
    </button>
  );
}
