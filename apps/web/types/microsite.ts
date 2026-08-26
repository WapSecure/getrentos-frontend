export interface MicrositeProfile {
  slug: string;
  landlordId: string;
  displayName: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  listingCount: number;
}

export interface MicrositeListing {
  id: string;
  propertyId: string;
  title: string;
  location: string;
  price: number;
  period: 'month';
  bedrooms: number;
  bathrooms: number;
  image: string;
}
