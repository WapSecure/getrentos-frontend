import { AREAS, type Area } from '@/components/home/areas';
import { publicFetchInit } from '@/lib/publicFetch';
import {
  rentToCard,
  saleToCard,
  type PublicListingCard,
  type RentApiItem,
  type SaleApiItem,
} from '@/lib/publicListingMap';
import type { Paginated } from '@/lib/apiHelpers';
import { areaSlug } from '@/lib/areaSlug';

/**
 * An area page is published only when this many live listings match it. Below that the page
 * would be a thin search result dressed up as a guide, so it 404s and stays out of the sitemap.
 */
export const MIN_AREA_LISTINGS = 3;

const SHOWN_PER_MARKET = 6;

export interface AreaInventory {
  area: Area;
  rent: PublicListingCard[];
  sale: PublicListingCard[];
  rentTotal: number;
  saleTotal: number;
}

const API = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchPage<T>(path: string, search: string, pageSize: number) {
  const res = await fetch(
    `${API()}${path}?search=${encodeURIComponent(search)}&page=1&pageSize=${pageSize}`,
    publicFetchInit()
  );
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return (await res.json()) as Paginated<T>;
}

/** Live rent and sale listings matching an area; null when the API cannot answer. */
export async function areaInventory(
  area: Area,
  pageSize = SHOWN_PER_MARKET
): Promise<AreaInventory | null> {
  try {
    const [rent, sale] = await Promise.all([
      fetchPage<RentApiItem>('/rentals', area.name, pageSize),
      fetchPage<SaleApiItem>('/marketplace/listings', area.name, pageSize),
    ]);
    return {
      area,
      rent: rent.items.map(rentToCard),
      sale: sale.items.map(saleToCard),
      rentTotal: rent.total ?? rent.items.length,
      saleTotal: sale.total ?? sale.items.length,
    };
  } catch {
    return null;
  }
}

export const inventoryTotal = (inventory: AreaInventory) =>
  inventory.rentTotal + inventory.saleTotal;

/** Areas with enough live listings for a page of their own, with their slugs. */
export async function publishedAreas(): Promise<Array<Area & { slug: string }>> {
  const results = await Promise.all(AREAS.map((area) => areaInventory(area, 1)));
  return results
    .filter((inv): inv is AreaInventory => inv !== null && inventoryTotal(inv) >= MIN_AREA_LISTINGS)
    .map((inv) => ({ ...inv.area, slug: areaSlug(inv.area.name) }));
}
