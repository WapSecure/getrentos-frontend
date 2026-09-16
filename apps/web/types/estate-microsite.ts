export interface EstateMicrositeProfile {
  slug: string;
  estateId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  bannerUrl?: string;
  bio?: string;
  /** Published listings inside the estate, by market. */
  listingCount?: number;
  rentCount?: number;
  saleCount?: number;
  shortletCount?: number;
  gates?: number | null;
  /** Whether the estate's public page is switched on. */
  storefrontEnabled?: boolean;
}
