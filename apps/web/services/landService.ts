import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
import type {
  LandOwnershipProofInput,
  LandParcelInput,
  OwnerLandApiRecord,
  OwnerLandRecord,
  PublicLandListingApi,
  PublicLandListing,
} from '@/types/land';

export interface OwnerLandListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export interface PublicLandListParams {
  page?: number;
  pageSize?: number;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest';
}

const mapOwnerLand = (record: OwnerLandApiRecord): OwnerLandRecord => ({
  property: {
    id: record.propertyId,
    title: record.title,
    address: record.address,
    city: record.city,
    state: record.state,
    country: record.country,
    verificationStatus: record.propertyVerificationStatus,
    coverImageKey: record.coverImageUrl,
    hasActiveSaleListing: record.hasActiveSaleListing,
  },
  parcel: record.parcel ?? null,
  diligence: record.parcel?.diligence ?? null,
});

const mapPublicLand = (listing: PublicLandListingApi): PublicLandListing => ({
  id: listing.id,
  propertyId: listing.propertyId,
  title: listing.title,
  askingPrice: listing.price,
  description: listing.description,
  address: listing.address,
  city: listing.city,
  state: listing.state,
  country: listing.country,
  listedDate: listing.publishedAt,
  coverImageUrl: listing.coverImageUrl,
  ownerVerified: listing.isVerified,
  parcel: listing.parcel,
  diligence: listing.diligence,
});

/** Land uses Property, Listing, Offer and escrow as its system of record. */
export const landService = {
  listOwnerLand: (params: OwnerLandListParams = {}) =>
    safeCall(async () => {
      const response = await authFetch<Paginated<OwnerLandApiRecord>>(
        `/owner/land${toQuery({
          page: params.page,
          pageSize: params.pageSize,
          status: params.status,
          search: params.search,
        })}`
      );
      return { ...response, items: response.items.map(mapOwnerLand) };
    }),

  getOwnerLand: (propertyId: string) =>
    safeCall(async () =>
      mapOwnerLand(await authFetch<OwnerLandApiRecord>(`/owner/land/${propertyId}`))
    ),

  upsertParcel: (propertyId: string, parcel: LandParcelInput) =>
    safeCall(async () =>
      mapOwnerLand(
        await authFetch<OwnerLandApiRecord>(`/owner/land/${propertyId}/parcel`, {
          method: 'PUT',
          body: JSON.stringify(parcel),
        })
      )
    ),

  submitOwnershipProof: (propertyId: string, proof: LandOwnershipProofInput) => {
    const form = new FormData();
    form.append('document', proof.file);
    form.append('documentType', proof.documentType);
    return safeCall(() =>
      authFetch(`/users/me/kyc/ownership-proof/${propertyId}`, { method: 'POST', body: form })
    );
  },

  listPublic: (params: PublicLandListParams = {}) =>
    safeCall(async () => {
      const response = await authFetch<Paginated<PublicLandListingApi>>(
        `/land${toQuery({
          page: params.page,
          pageSize: params.pageSize,
          city: params.city,
          state: params.state,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          sort: params.sort,
        })}`
      );
      return { ...response, items: response.items.map(mapPublicLand) };
    }),

  getPublicListing: (listingId: string) =>
    safeCall(async () =>
      mapPublicLand(await authFetch<PublicLandListingApi>(`/land/listings/${listingId}`))
    ),
};
