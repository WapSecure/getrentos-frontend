import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Authenticated / admin surfaces must never be crawled or indexed.
        '/dashboard',
        '/renter',
        '/landlord',
        '/owner',
        '/buyer',
        '/realtor',
        '/agent',
        '/estate',
        '/gateman',
        '/resident',
        '/admin',
        // Internal / dev-only OAuth helpers.
        '/oauth',
        '/magic-link',
        // Query parameters should not create duplicate indexable URLs.
        '/shortlets?',
        '/land?',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
