import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { LandDossier } from '@/types/landDossier';

/** Buyer decision dossiers (signed-in; every view is recorded). */
export const landDossierService = {
  forListing: (listingId: string) =>
    safeCall(() =>
      authFetch<LandDossier>(`/land/listings/${encodeURIComponent(listingId)}/dossier`)
    ),
  forEstatePlot: (layoutId: string, plotId?: string, planId?: string) =>
    safeCall(() =>
      authFetch<LandDossier>(
        `/land/layouts/${encodeURIComponent(layoutId)}/dossier${toQuery({ plotId, planId })}`
      )
    ),
};

export const landDossierKeys = {
  listing: (listingId: string) => ['land', 'dossier', 'listing', listingId] as const,
  estate: (layoutId: string, plotId?: string, planId?: string) =>
    ['land', 'dossier', 'estate', layoutId, plotId ?? '', planId ?? ''] as const,
};
