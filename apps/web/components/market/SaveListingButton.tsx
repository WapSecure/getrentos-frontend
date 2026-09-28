'use client';

import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMarketSaved } from '@/hooks/useMarketSaved';
import { cn } from '@getrentos/shared';

export function SaveListingButton({
  listingId,
  returnPath,
  className,
}: {
  listingId: string;
  returnPath: string;
  className?: string;
}) {
  const router = useRouter();
  const { signedIn, savedIds, toggle } = useMarketSaved();
  const saved = savedIds.has(listingId);

  return (
    <button
      type="button"
      aria-label={saved ? 'Remove listing from saved' : 'Save listing'}
      aria-pressed={saved}
      disabled={toggle.isPending}
      onClick={() => {
        if (!signedIn) {
          router.push(`/login?next=${encodeURIComponent(returnPath)}`);
          return;
        }
        toggle.mutate({ listingId, next: !saved });
      }}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white shadow-sm backdrop-blur-md transition hover:scale-105 hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait disabled:opacity-60',
        className
      )}
    >
      <Heart className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  );
}
