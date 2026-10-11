'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Opens the conversation named in `?conversation=<id>`: where a message
 * notification lands. Waits for the page's conversation list (`ready`), opens
 * each id once, and reacts when another notification is clicked while the
 * inbox is already open.
 */
export function useOpenConversationFromUrl(ready: boolean, open: (conversationId: string) => void) {
  const id = useSearchParams().get('conversation');
  const handled = useRef<string | null>(null);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });

  useEffect(() => {
    if (!id || !ready || handled.current === id) return;
    handled.current = id;
    // Next tick, so the page's own state update is not made inside this effect.
    const timeoutId = window.setTimeout(() => openRef.current(id), 0);
    return () => window.clearTimeout(timeoutId);
  }, [id, ready]);
}
