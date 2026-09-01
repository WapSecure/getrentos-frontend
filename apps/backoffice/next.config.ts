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
 * Avatar/verification images are served by the GetRentos API, so the API
 * host must be allowed for `next/image` to optimize them.
 */
function imageRemotePatterns(): ImageRemotePattern[] {
  const patterns: ImageRemotePattern[] = [{ protocol: 'http', hostname: 'localhost', port: '*' }];

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
};

export default nextConfig;
