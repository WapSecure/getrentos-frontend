import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Public, crawlable routes. Authenticated role dashboards are intentionally
 * excluded — they add no SEO value and are protected by middleware.
 */
const publicRoutes: Array<{
  path: string;
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency'];
}> = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/shortlets', priority: 0.9, changeFrequency: 'daily' },
  { path: '/land', priority: 0.9, changeFrequency: 'daily' },
  { path: '/home-management', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/role-selection', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/signup', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/login', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/forgot-password', priority: 0.3, changeFrequency: 'monthly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency ?? 'weekly',
    priority: route.priority ?? 0.5,
  }));
}
