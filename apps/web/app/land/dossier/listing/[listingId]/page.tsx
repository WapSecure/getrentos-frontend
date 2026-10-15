'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { LandDossierView } from '@/components/land/dossier/LandDossierView';
import { unwrap } from '@/lib/apiHelpers';
import { landDossierKeys, landDossierService } from '@/services/landDossierService';

export default function LandListingDossierPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const query = useQuery({
    queryKey: landDossierKeys.listing(listingId),
    queryFn: () => unwrap(landDossierService.forListing(listingId)),
    retry: false,
  });
  return (
    <>
      <div className="print:hidden">
        <Navigation />
      </div>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-24 print:pt-0">
        {query.isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
        ) : query.data ? (
          <LandDossierView dossier={query.data} />
        ) : (
          <p className="text-sm text-destructive">
            {query.error instanceof Error ? query.error.message : 'This dossier is not available.'}{' '}
            Sign in to read land dossiers.
          </p>
        )}
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
