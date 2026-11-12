import type { MetadataRoute } from 'next';
import { ROUTES } from '@sureground/shared';
import { SITE_URL } from '@/lib/site';
import { listingPath, type PublicListingKind } from '@/lib/listingSlug';

// Rebuilt at most hourly; listings are published and withdrawn through the day.
export const revalidate = 3600;

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const PAGE_SIZE = 100;
// 10 pages x 100 per market keeps one sitemap well under the 50,000 URL limit.
const MAX_PAGES = 10;

// Public list endpoints: each returns only published listings.
const LISTING_SOURCES: Array<{ kind: PublicListingKind; path: string }> = [
  { kind: 'rent', path: '/rentals' },
  { kind: 'sale', path: '/marketplace/listings' },
  { kind: 'land', path: '/land' },
  { kind: 'shortlet', path: '/shortlets' },
];

interface ListedItem {
  id: string;
  title?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
}

async function listingEntries(
  kind: PublicListingKind,
  path: string
): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    let body: { items?: ListedItem[]; totalPages?: number };
    try {
      const res = await fetch(`${API}${path}?page=${page}&pageSize=${PAGE_SIZE}`, {
        next: { revalidate },
      });
      if (!res.ok) break;
      body = await res.json();
    } catch {
      // API unreachable: publish the static pages rather than failing the whole sitemap.
      break;
    }
    for (const item of body.items ?? []) {
      if (!item?.id) continue;
      const stamp = item.updatedAt ?? item.publishedAt;
      entries.push({
        url: `${SITE_URL}${listingPath(kind, item.id, item.title)}`,
        lastModified: stamp ? new Date(stamp) : undefined,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
    if (!body.totalPages || page >= body.totalPages) break;
  }
  return entries;
}

const publicRoutes: Array<{
  path: string;
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency'];
}> = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/rent', priority: 0.9, changeFrequency: 'daily' },
  { path: '/buy', priority: 0.9, changeFrequency: 'daily' },
  { path: '/shortlets', priority: 0.9, changeFrequency: 'daily' },
  { path: '/estates', priority: 0.8, changeFrequency: 'daily' },
  { path: '/land', priority: 0.9, changeFrequency: 'daily' },
  { path: '/home-management', priority: 0.7, changeFrequency: 'weekly' },
  { path: ROUTES.PRICING, priority: 0.8, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.3, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries = publicRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency ?? 'weekly',
    priority: route.priority ?? 0.5,
  }));

  const listings = await Promise.all(
    LISTING_SOURCES.map(({ kind, path }) => listingEntries(kind, path))
  );
  return [...staticEntries, ...listings.flat()];
}
