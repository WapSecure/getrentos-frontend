'use client';

import { useState } from 'react';
import { Share2 } from '@sureground/icons';
import { IconButton } from '@sureground/ui';
import { ShareDialog } from '@/components/shared/share/ShareDialog';
import { track } from '@/lib/analytics';

export function ShowroomShareButton({
  listingId,
  title,
  path,
}: {
  listingId: string;
  title: string;
  path: string;
}) {
  const [open, setOpen] = useState(false);

  const share = async () => {
    track({ name: 'property_share', listingId, surface: 'listing_page' });
    const url = `${window.location.origin}${path}`;
    // Phones get the system sheet (WhatsApp is usually first); everyone else gets our dialog.
    if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    setOpen(true);
  };

  return (
    <>
      <IconButton
        label="Share"
        icon={<Share2 className="h-5 w-5" />}
        onClick={share}
        className="border border-border bg-card"
      />
      <ShareDialog open={open} onOpenChange={setOpen} title={title} path={path} />
    </>
  );
}
