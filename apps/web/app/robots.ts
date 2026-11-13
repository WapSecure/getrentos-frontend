import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // Filtered and paginated market views are not blocked here: they carry noindex,follow, which a crawler can only
      // see if it may fetch them, and their listing links should still be followed. See docs/marketing/decisions.md.
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
        // Private return and invitation screens (they also carry noindex).
        '/payments',
        '/billing',
        '/agency-invite',
        '/auth',
        '/representing',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
