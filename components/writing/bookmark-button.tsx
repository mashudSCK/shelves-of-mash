'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleBookmark } from '@/lib/actions/bookmarks';

export function BookmarkButton({
  writingId,
  initialBookmarked,
  isAuthenticated,
}: {
  writingId: string;
  initialBookmarked: boolean;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isAuthenticated) {
      router.push('/login?next=' + encodeURIComponent(window.location.pathname));
      return;
    }
    // Optimistic toggle, reconciled by the server action result.
    setBookmarked((prev) => !prev);
    startTransition(async () => {
      const result = await toggleBookmark(writingId);
      if ('bookmarked' in result) {
        setBookmarked(result.bookmarked);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full border transition-colors',
        bookmarked
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-border text-muted-foreground hover:border-accent hover:text-accent'
      )}
    >
      <Bookmark className="h-[18px] w-[18px]" fill={bookmarked ? 'currentColor' : 'none'} strokeWidth={1.75} />
    </button>
  );
}
