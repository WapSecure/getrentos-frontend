'use client';

import { IconButton, ListingCardAction } from '@sureground/ui';
import { Heart } from '@sureground/icons';
import { useRouter } from 'next/navigation';
import { useMarketSaved } from '@/hooks/useMarketSaved';
import { cn } from '@sureground/shared';

export function SaveListingButton({
  listingId,
  returnPath,
  className,
  appearance = 'overlay',
}: {
  listingId: string;
  returnPath: string;
  className?: string;
  /** `card` matches the other actions on a ListingCard photo. */
  appearance?: 'overlay' | 'card';
}) {
  const router = useRouter();
  const { signedIn, savedIds, toggle } = useMarketSaved();
  const saved = savedIds.has(listingId);

  const props = {
    label: saved ? 'Remove listing from saved' : 'Save listing',
    icon: <Heart fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />,
    'aria-pressed': saved,
    disabled: toggle.isPending,
    onClick: () => {
      if (!signedIn) {
        router.push(`/login?next=${encodeURIComponent(returnPath)}`);
        return;
      }
      toggle.mutate({ listingId, next: !saved });
    },
  };

  if (appearance === 'card') {
    return (
      <ListingCardAction
        {...props}
        className={cn('disabled:cursor-wait disabled:opacity-60', className)}
      />
    );
  }

  return (
    <IconButton
      {...props}
      size="lg"
      className={cn(
        'rounded-full border border-white/30 bg-black/60 text-white shadow-sm backdrop-blur-md transition hover:scale-105 hover:bg-black/75 hover:text-white focus-visible:ring-white disabled:cursor-wait disabled:opacity-60',
        className
      )}
    />
  );
}
