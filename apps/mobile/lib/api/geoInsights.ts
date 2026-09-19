import { apiFetch } from './client';

export interface NearbyPlace {
  name: string;
  address: string;
  rating: number | null;
  userRatingsTotal: number | null;
  distanceMeters: number;
}

export type NeighborhoodCategory =
  | 'schools'
  | 'hospitals'
  | 'transit'
  | 'parks'
  | 'restaurants'
  | 'supermarkets'
  | 'gyms'
  | 'pharmacies';

export type Neighborhood = Partial<Record<NeighborhoodCategory, NearbyPlace[]>>;

export interface TravelModeResult {
  durationSeconds: number;
  durationText: string;
  distanceMeters: number;
  distanceText: string;
}

export interface TravelTimes {
  destination: string;
  destinationCoords: { latitude: number; longitude: number };
  modes: Partial<Record<'driving' | 'transit' | 'walking', TravelModeResult | null>>;
}

export interface Walkability {
  score: number;
  label: 'Very walkable' | 'Walkable' | 'Somewhat walkable' | 'Car-dependent';
  summary: string;
}

export interface GeoInsights {
  listingId: string;
  propertyId: string;
  title: string;
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  neighborhood: Neighborhood | null;
  travelTimes: TravelTimes | null;
  pricing: {
    price: number;
    sizeSqm: number | null;
    pricePerSqm: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
  };
  walkability: Walkability | null;
  aiSummary: string | null;
  generatedAt: string;
  cacheTtlSeconds: number;
}

export const NEIGHBORHOOD_CATEGORY_LABEL: Record<NeighborhoodCategory, string> = {
  schools: 'Schools',
  hospitals: 'Hospitals',
  transit: 'Transit',
  parks: 'Parks',
  restaurants: 'Restaurants',
  supermarkets: 'Supermarkets',
  gyms: 'Gyms',
  pharmacies: 'Pharmacies',
};

export const geoInsightsApi = {
  get: (listingId: string, destination?: string) => {
    const params = destination ? `?destination=${encodeURIComponent(destination)}` : '';
    return apiFetch<GeoInsights>(`/renter/listings/${listingId}/geo-insights${params}`);
  },
};
