'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ShieldCheck, Star, MessageCircle, BedDouble, Bath } from 'lucide-react';
import { Button, Pagination } from '@getrentos/ui';
import { micrositeService } from '@/services/micrositeService';
import { renterService } from '@/services/renterService';
import { unwrap, isAuthenticated, getStoredUser } from '@/lib/apiHelpers';
import { formatCurrency, getInitials } from '@/lib/format';
import { ROUTES } from '@/lib/constants/auth';
import type { MicrositeProfile } from '@/types/microsite';

const PAGE_SIZE = 12;

interface MicrositePageClientProps {
  slug: string;
  /** Server-fetched profile (from generateMetadata) used to hydrate the query. */
  initialProfile?: MicrositeProfile;
}

export const MicrositePageClient = ({ slug, initialProfile }: MicrositePageClientProps) => {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery({
    queryKey: ['microsite', slug, 'profile'],
    queryFn: () => unwrap(micrositeService.getProfile(slug)),
    initialData: initialProfile,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const { data: listingsData } = useQuery({
    queryKey: ['microsite', slug, 'listings', page],
    queryFn: () => unwrap(micrositeService.listListings(slug, { page, pageSize: PAGE_SIZE })),
    enabled: !!profile,
  });
  const listings = listingsData?.items ?? [];
  const total = listingsData?.total ?? 0;

  const contactMutation = useMutation({
    mutationFn: () => unwrap(renterService.startConversation(profile!.landlordId)),
    onSuccess: () => router.push(ROUTES.RENTER_MESSAGES),
  });

  const handleContact = () => {
    const user = getStoredUser<{ roles?: string[] }>();
    if (!isAuthenticated() || !user?.roles?.includes('RENTER')) {
      router.push(`${ROUTES.LOGIN}?next=/l/${slug}`);
      return;
    }
    contactMutation.mutate();
  };

  if (profileLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-muted-foreground">Loading…</div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-foreground">Microsite not found</h1>
        <p className="text-muted-foreground mt-2">
          This link may be incorrect or no longer active.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden bg-secondary mt-6">
        {profile.bannerUrl ? (
          <Image
            src={profile.bannerUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 1024px"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-r from-primary/20 to-primary/5" />
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-4 px-2">
        <div className="w-20 h-20 rounded-2xl bg-card border-4 border-background shadow-sm flex items-center justify-center overflow-hidden shrink-0 -mt-10">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.displayName}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-xl font-bold text-primary">
              {getInitials(profile.displayName)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 pb-1 pt-3">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-bold text-foreground">{profile.displayName}</h1>
            {profile.verified && <ShieldCheck className="w-5 h-5 text-green-500" />}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            {profile.reviewCount > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                {profile.rating.toFixed(1)} ({profile.reviewCount})
              </span>
            )}
            <span>
              {profile.listingCount} listing{profile.listingCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={handleContact}
          isLoading={contactMutation.isPending}
        >
          <MessageCircle className="w-4 h-4" />
          Contact Agency
        </Button>
      </div>

      {profile.bio && <p className="text-sm text-muted-foreground mt-6 max-w-2xl">{profile.bio}</p>}

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-foreground mb-4">Available Listings</h2>
        {listings.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
            No active listings right now.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="relative h-40 bg-secondary">
                  {listing.image ? (
                    <Image
                      src={listing.image}
                      alt={listing.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {listing.location}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5" />
                      {listing.bedrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5" />
                      {listing.bathrooms}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-primary mt-2">
                    {formatCurrency(listing.price)}/{listing.period}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {total > 0 && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            className="mt-6"
          />
        )}
      </div>
    </div>
  );
};
