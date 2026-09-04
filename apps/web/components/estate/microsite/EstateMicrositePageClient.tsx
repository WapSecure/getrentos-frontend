'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin } from 'lucide-react';
import { estateMicrositeService } from '@/services/estateMicrositeService';
import { unwrap } from '@/lib/apiHelpers';
import type { EstateMicrositeProfile } from '@/types/estate-microsite';

interface EstateMicrositePageClientProps {
  slug: string;
  /** Server-fetched profile (from generateMetadata) used to hydrate the query. */
  initialProfile?: EstateMicrositeProfile;
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
    queryKey: ['estate-microsite', slug, 'profile'],
    queryFn: () => unwrap(estateMicrositeService.getProfile(slug)),
    initialData: initialProfile,
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted-foreground">Loading…</div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-foreground">Estate not found</h1>
        <p className="text-muted-foreground mt-2">
          This link may be incorrect or no longer active.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">
      <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden bg-secondary mt-6">
        {profile.bannerUrl ? (
          <Image
            src={profile.bannerUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-r from-primary/20 to-primary/5 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-primary/40" />
          </div>
        )}
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
    </div>
  );
};
