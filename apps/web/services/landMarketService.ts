import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
import type { PublicLandListParams } from '@/services/landService';
import type { LandAssuranceTier, PublicLandListing, PublicLandListingApi } from '@/types/land';
import type {
  LandComparables,
  LandMarketInsights,
  LandMarketInsightsParams,
} from '@/types/landMarket';

export interface AssuredLandListParams extends PublicLandListParams {
  /** Only parcels verified to at least this assurance tier. */
  minAssuranceTier?: LandAssuranceTier;
}

/** Same adaptation as landService's public mapper, kept here so that file stays untouched. */
const mapPublicLand = (listing: PublicLandListingApi): PublicLandListing => ({
  id: listing.id,
  propertyId: listing.propertyId,
  title: listing.title,
  askingPrice: listing.price,
  description: listing.description,
  address: listing.address,
  addressHidden: listing.addressHidden,
  city: listing.city,
  state: listing.state,
  country: listing.country,
  listedDate: listing.publishedAt,
  coverImageUrl: listing.coverImageUrl,
  ownerVerified: listing.isVerified,
  parcel: listing.parcel,
  diligence: listing.diligence,
});

/** Public land market intelligence. Every figure covers verified, in-date land only. */
export const landMarketService = {
  /**
   * The public land search with the assurance-tier filter, which
   * `landService.listPublic` does not pass through.
   */
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
