import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // Robots rules match by prefix: '/agent' would also block '/agents', and '/estate' '/estates'. The longer allow wins.
      allow: ['/', '/agents', '/estates', '/landlords', '/renters', '/buyers'],
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
