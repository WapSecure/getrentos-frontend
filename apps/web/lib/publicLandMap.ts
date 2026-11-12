// Pure: the `/land` server page pre-renders its first page with it, and the api helpers reach for localStorage.
import type { PublicLandListing, PublicLandListingApi } from '@/types/land';

/** Same adaptation as landService's public mapper, kept separate so that file stays untouched. */
export const mapPublicLand = (listing: PublicLandListingApi): PublicLandListing => ({
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
  imageVariants: listing.imageVariants,
  imagePreview: listing.imagePreview,
  ownerVerified: listing.isVerified,
  ...(typeof listing.latitude === 'number' && typeof listing.longitude === 'number'
    ? {
        latitude: listing.latitude,
        longitude: listing.longitude,
        locationPrecision: listing.locationPrecision ?? 'approximate',
      }
    : {}),
  parcel: listing.parcel,
  diligence: listing.diligence,
});
