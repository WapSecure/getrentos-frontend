import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // Robots rules match by prefix, so '/agent' would also block '/agents'. The longer allow wins.
      allow: ['/', '/agents', '/landlords', '/renters', '/buyers'],
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
        '/oauth',
        '/magic-link',
        '/shortlets?',
        '/land?',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
