'use client';

import { SafeImage } from '@/components/shared/media/SafeImage';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  IconButton,
  Skeleton,
  useOptimisticMutation,
} from '@getrentos/ui';
import { BedDouble, Heart, MapPin } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/format';
import type { ShortletListing } from '@/types/shortlet';

export function ShortletWishlistDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: shortletKeys.wishlist,
    queryFn: () => unwrap(shortletService.myWishlist({ page: 1, pageSize: 50 })),
  });
  const listings = data?.items ?? [];

  const unsave = useOptimisticMutation({
    mutationFn: (listingId: string) => unwrap(shortletService.unsaveWishlist(listingId)),
    patches: (listingId) => [
      {
        queryKey: shortletKeys.wishlist,
        update: (old) => {
          const page = old as NonNullable<typeof data>;
          return { ...page, items: page.items.filter((l) => l.id !== listingId) };
        },
      },
      {
        queryKey: shortletKeys.wishlistIds,
        update: (old) => (old as string[]).filter((id) => id !== listingId),
      },
    ],
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0">
        <div className="p-5">
          <DialogTitle>Saved shortlets</DialogTitle>
          <DialogDescription>Shortlets you saved to visit later.</DialogDescription>
        </div>
        <div className="max-h-[70vh] overflow-y-auto border-t border-border p-5">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Nothing saved yet"
              description="Tap the heart on any shortlet to save it here."
            />
          ) : (
            <div className="divide-y divide-border">
              {listings.map((l) => (
                <WishlistRow
                  key={l.id}
                  listing={l}
                  removing={unsave.isPending && unsave.variables === l.id}
                  onRemove={() => unsave.mutate(l.id)}
                  onOpen={() => {
                    onClose();
                    router.push(`/shortlets/${l.id}`);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WishlistRow({
  listing,
  removing,
  onRemove,
  onOpen,
}: {
  listing: ShortletListing;
  removing: boolean;
  onRemove: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="flex h-16 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary/60">
        {listing.coverImageUrl ? (
          <div className="relative h-full w-full">
            <SafeImage
              src={listing.coverImageUrl}
              alt={listing.title}
              fill
              sizes="80px"
              className="object-cover"
              loading="lazy"
              fallback={<BedDouble className="h-6 w-6 text-muted-foreground" />}
            />
          </div>
        ) : (
          <BedDouble className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{listing.title}</p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {listing.city}, {listing.state}
        </p>
        <p className="mt-0.5 text-sm">
          {listing.nightlyRate != null ? formatCurrency(listing.nightlyRate) : '—'}
          {listing.pricingMode === 'PER_NIGHT' ? ' / night' : ' / stay'}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" onClick={onOpen}>
          View
        </Button>
        <IconButton
          size="sm"
          label={`Remove ${listing.title} from saved`}
          icon={<Heart className="fill-destructive text-destructive" />}
          onClick={onRemove}
          disabled={removing}
        />
      </div>
    </div>
  );
}
