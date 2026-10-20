'use client';

import { IconButton } from '@getrentos/ui';
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
    <IconButton
      label={saved ? 'Remove listing from saved' : 'Save listing'}
      icon={<Heart fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />}
      size="lg"
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
        'rounded-full border border-white/30 bg-black/60 text-white shadow-sm backdrop-blur-md transition hover:scale-105 hover:bg-black/75 hover:text-white focus-visible:ring-white disabled:cursor-wait disabled:opacity-60',
        className
      )}
    />
  );
}
