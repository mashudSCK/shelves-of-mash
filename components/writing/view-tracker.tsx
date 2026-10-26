'use client';

import { useEffect } from 'react';

export function ViewTracker({ writingId }: { writingId: string }) {
  useEffect(() => {
    async function recordView(persistIdentity: boolean) {
      let visitorId: string | null = null;
      try {
        if (persistIdentity) {
          visitorId = localStorage.getItem('shelves-reader-id');
          if (!visitorId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) {
            visitorId = crypto.randomUUID();
            localStorage.setItem('shelves-reader-id', visitorId);
          }
        }
      } catch {
        visitorId = null;
        // Signed-in readers can still count when browser storage is unavailable.
      }
      await fetch(`/api/writings/${writingId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
        keepalive: true,
      }).catch(() => {
        // Analytics must not interrupt reading. A later visit can retry.
      });
    }

    // Coordinate first visits across tabs before creating a browser identity.
    if (navigator.locks) {
      void navigator.locks.request('shelves-reader-id', () => recordView(true))
        .catch(() => recordView(false));
    } else {
      void recordView(false);
    }
  }, [writingId]);

  return null;
}
