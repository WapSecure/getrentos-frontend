'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin } from 'lucide-react';
import { EmptyState, Skeleton } from '@getrentos/ui';
import { SafeImage } from '@/components/shared/media/SafeImage';
import { estateStorefrontService } from '@/services/estateMarketplaceService';
import { EstateAvailableListings } from './EstateAvailableListings';
import { unwrap } from '@/lib/apiHelpers';
import type { EstateStorefront } from '@/types/estate-marketplace';

interface EstateMicrositePageClientProps {
  slug: string;
  /** Server-fetched profile (from generateMetadata) used to hydrate the query. */
  initialProfile?: EstateStorefront;
}

export const EstateMicrositePageClient = ({
  slug,
  initialProfile,
}: EstateMicrositePageClientProps) => {
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['estate-storefront', slug, 'profile'],
    queryFn: () => unwrap(estateStorefrontService.getStorefront(slug)),
    initialData: initialProfile,
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 pb-16" role="status" aria-label="Loading">
        <Skeleton className="h-48 sm:h-64 w-full rounded-2xl mt-6" />
        <div className="px-2 mt-6 space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24">
        <EmptyState
          icon={Building2}
          title="Estate not found"
          description="This link may be incorrect or no longer active."
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">
      <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden bg-secondary mt-6">
        <SafeImage
          src={profile.bannerUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
          fallback={
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Building2 className="w-12 h-12 text-primary/40" />
            </div>
          }
        />
      </div>

      <div className="px-2 mt-6">
        <h1 className="text-xl font-bold text-foreground">{profile.name}</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {profile.address}, {profile.city}, {profile.state}
        </p>
        {profile.bio && (
          <p className="text-sm text-muted-foreground mt-6 max-w-2xl">{profile.bio}</p>
        )}
      </div>

      <EstateAvailableListings
        slug={slug}
        initialCounts={
          profile.rentCount !== undefined &&
          profile.saleCount !== undefined &&
          profile.shortletCount !== undefined
            ? {
                rent: profile.rentCount,
                sale: profile.saleCount,
                shortlet: profile.shortletCount,
              }
            : undefined
        }
      />
    </div>
  );
};
