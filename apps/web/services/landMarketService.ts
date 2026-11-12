import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
import type { PublicLandListParams } from '@/services/landService';
import type { LandAssuranceTier, PublicLandListingApi } from '@/types/land';
import { mapPublicLand } from '@/lib/publicLandMap';
import { areaQuery, type MapArea } from '@/lib/mapArea';
import type {
  LandComparables,
  LandMarketInsights,
  LandMarketInsightsParams,
} from '@/types/landMarket';

export interface AssuredLandListParams extends PublicLandListParams {
  /** Only parcels verified to at least this assurance tier. */
  minAssuranceTier?: LandAssuranceTier;
  /** Only parcels shown inside this map area. */
  area?: MapArea;
}

/** Every figure covers verified, in-date land only. */
export const landMarketService = {
  /** `landService.listPublic` does not pass the assurance-tier filter through. */
  listPublic: (params: AssuredLandListParams = {}) =>
    safeCall(async () => {
      const response = await authFetch<Paginated<PublicLandListingApi>>(
        `/land${toQuery({
          page: params.page,
          pageSize: params.pageSize,
          city: params.city,
          state: params.state,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          search: params.search,
          estate: params.estate,
          titleType: params.titleType,
          minAreaSqm: params.minAreaSqm,
          maxAreaSqm: params.maxAreaSqm,
          roadAccess: params.roadAccess ? 'true' : undefined,
          minAssuranceTier: params.minAssuranceTier,
          sort: params.sort,
          ...areaQuery(params.area),
        })}`
      );
      return { ...response, items: response.items.map(mapPublicLand) };
    }),

  insights: (params: LandMarketInsightsParams = {}) =>
    safeCall(() =>
      authFetch<LandMarketInsights>(
        `/land/market/insights${toQuery({
          state: params.state,
          city: params.city,
          estate: params.estate,
          titleType: params.titleType,
        })}`
      )
    ),

  comparables: (listingId: string, limit = 6) =>
    safeCall(() =>
      authFetch<LandComparables>(
        `/land/listings/${encodeURIComponent(listingId)}/comparables${toQuery({ limit })}`
      )
    ),
};
