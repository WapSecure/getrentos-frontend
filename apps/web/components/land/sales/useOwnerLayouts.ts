'use client';

import { useQuery } from '@tanstack/react-query';
import { unwrap, unwrapOptional } from '@/lib/apiHelpers';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { landDeveloperService } from '@/services/landDeveloperService';
import { landService } from '@/services/landService';

export interface OwnerLayoutOption {
  layoutId: string;
  layoutName: string;
  propertyId: string;
  propertyTitle: string;
}

/**
 * Every estate layout the owner runs.
 *
 * The API has no "my layouts" list, so this reads the land portfolio and asks
 * each subdividable parcel for its layout (a 404 means it has none). Owners
 * have a handful of parcels, so the fan-out stays small; it is capped at the
 * first 100 parcels.
 */
export const useOwnerLayouts = () =>
  useQuery({
    queryKey: landDeveloperKeys.layouts,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<OwnerLayoutOption[]> => {
      const portfolio = await unwrap(landService.listOwnerLand({ page: 1, pageSize: 100 }));
      const candidates = portfolio.items.filter((record) => record.parcel?.subdivisionAllowed);
      const layouts = await Promise.all(
        candidates.map(async (record) => {
          const layout = await unwrapOptional(
            landDeveloperService.getLayout(record.property.id),
            null
          ).catch(() => null);
          return layout
            ? {
                layoutId: layout.id,
                layoutName: layout.name,
                propertyId: record.property.id,
                propertyTitle: record.property.title,
              }
            : null;
        })
      );
      return layouts.filter((layout): layout is OwnerLayoutOption => layout !== null);
    },
  });
