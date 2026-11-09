import type { NextConfig } from 'next';

type ImageRemotePattern = {
  protocol?: 'http' | 'https';
  hostname: string;
  port?: string;
  pathname?: string;
};

// next/image must allow the API host that serves uploads; add a dedicated upload CDN host here too.
function imageRemotePatterns(): ImageRemotePattern[] {
  const patterns: ImageRemotePattern[] = [
    // Omitting `port` matches any port; `port: '*'` does not (Next rejects localhost:9000 with it).
    { protocol: 'http', hostname: 'localhost' },
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
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  transpilePackages: ['@sureground/shared', '@sureground/ui', '@sureground/icons'],
  experimental: { optimizePackageImports: ['@sureground/ui', '@sureground/icons'] },
  images: {
    remotePatterns: imageRemotePatterns(),
    // Next 16 blocks remote images on private IPs (SSRF guard); relaxed in dev only, for MinIO on localhost.
    ...(process.env.NODE_ENV !== 'production' ? { dangerouslyAllowLocalIP: true } : {}),
  },
  async redirects() {
    // Old renter URLs redirect to the tab of the hub they were merged into.
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
    ];
  },
};

export default nextConfig;
