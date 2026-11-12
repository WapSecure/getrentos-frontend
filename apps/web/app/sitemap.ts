import type { MetadataRoute } from 'next';
import { ROUTES } from '@sureground/shared';
import { DIASPORA_ROUTES } from '@/lib/constants/diasporaRoutes';
import { diasporaInvestEnabled } from '@/lib/diasporaAvailability';
import { SITE_URL } from '@/lib/site';
import { availableGuides } from '@/components/resources/availableGuides';
import { publishedAreas } from '@/lib/areaInventory';
import { listingPath, type PublicListingKind } from '@/lib/listingSlug';
import { DEVELOPMENTS_PATH, developmentPath } from '@/lib/publicDevelopments';

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

// The public endpoint returns live developments only (every staff check passed); 48 is its page cap.
const DEVELOPMENT_PAGE_SIZE = 48;

async function developmentEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    let body: { items?: Array<{ id?: unknown }>; totalPages?: number };
    try {
      const res = await fetch(
        `${API}${DEVELOPMENTS_PATH}?page=${page}&pageSize=${DEVELOPMENT_PAGE_SIZE}`,
        { next: { revalidate } }
      );
      if (!res.ok) break;
      body = await res.json();
    } catch {
      break;
    }
    for (const item of body.items ?? []) {
      if (typeof item?.id !== 'string' || !item.id) continue;
      entries.push({
        url: `${SITE_URL}${developmentPath(item.id)}`,
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
  { path: DEVELOPMENTS_PATH, priority: 0.8, changeFrequency: 'daily' },
  { path: '/home-management', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/sell', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/landlords', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/renters', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/buyers', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/agents', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/resources', priority: 0.6, changeFrequency: 'monthly' },
  { path: ROUTES.PRICING, priority: 0.8, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.3, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Diaspora Invest pages 404 while the service is switched off, so they are listed only when it is on.
  const routes = (await diasporaInvestEnabled())
    ? [
        ...publicRoutes,
        { path: DIASPORA_ROUTES.PUBLIC, priority: 0.7, changeFrequency: 'monthly' as const },
        { path: DIASPORA_ROUTES.TRANSPARENCY, priority: 0.4, changeFrequency: 'monthly' as const },
      ]
    : publicRoutes;

  const staticEntries = routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency ?? 'weekly',
    priority: route.priority ?? 0.5,
  }));

  const [listings, areas, guides, developments] = await Promise.all([
    Promise.all(LISTING_SOURCES.map(({ kind, path }) => listingEntries(kind, path))),
    // Only areas with enough live listings have a page; the rest 404.
    publishedAreas(),
    availableGuides(),
    developmentEntries(),
  ]);
  const areaEntries = areas.map((area) => ({
    url: `${SITE_URL}/areas/${area.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));
  const guideEntries = guides.map((guide) => ({
    url: `${SITE_URL}/resources/${guide.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));
  return [...staticEntries, ...guideEntries, ...areaEntries, ...listings.flat(), ...developments];
}
