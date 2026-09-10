import type { NextConfig } from 'next';

/** Shape accepted by Next's `images.remotePatterns` option. */
type ImageRemotePattern = {
  protocol?: 'http' | 'https';
  hostname: string;
  port?: string;
  pathname?: string;
};

/**
 * Derive the image optimizer allowlist from the configured API origin.
 * Listing/banner/avatar images are served by the GetRentos API, so the API
 * host must be allowed for `next/image` to optimize them. If uploads are
 * served from a dedicated CDN in production, add that hostname here too.
 */
function imageRemotePatterns(): ImageRemotePattern[] {
  const patterns: ImageRemotePattern[] = [
    // Local dev backend — any port (e.g. http://localhost:4000).
    { protocol: 'http', hostname: 'localhost', port: '*' },
  ];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const { protocol, hostname, port } = new URL(apiUrl);
      patterns.push({
        protocol: protocol === 'http:' ? 'http' : 'https',
        hostname,
        ...(port ? { port } : {}),
      });
    } catch {
      // Ignore malformed env values; localhost fallback still applies.
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  transpilePackages: ['@getrentos/shared', '@getrentos/ui'],
  images: {
    remotePatterns: imageRemotePatterns(),
  },
  async redirects() {
    // Several former standalone renter pages were merged into tabbed hubs to
    // trim the sidebar. Old URLs (bookmarks, deep links, in-app references)
    // keep working by landing on the right tab of the merged destination.
    return [
      { source: '/renter/lease', destination: '/renter/home?tab=lease', permanent: true },
      { source: '/renter/documents', destination: '/renter/home?tab=documents', permanent: true },
      {
        source: '/renter/financing',
        destination: '/renter/payments?tab=financing',
        permanent: true,
      },
      {
        source: '/renter/verification',
        destination: '/renter/trust-score?tab=verification',
        permanent: true,
      },
      {
        source: '/renter/credit-report',
        destination: '/renter/trust-score?tab=credit',
        permanent: true,
      },
      {
        source: '/renter/legal-resources',
        destination: '/renter/help?tab=legal',
        permanent: true,
      },
      { source: '/renter/ussd-access', destination: '/renter/settings?tab=ussd', permanent: true },
    ];
  },
};

export default nextConfig;
