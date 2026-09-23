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
  /**
   * Declares this app to the API as `x-client-app: backoffice`.
   *
   * The API namespaces its refresh cookie per app, because cookies are not
   * port- or app-scoped: without this the back office and the main web app,
   * which share a host, rotated each other's session and could end up acting as
   * the other's user. It also makes the API refuse a non-staff account at staff
   * sign-in rather than only checking roles after the fact.
   *
   * Set here rather than in `.env.local`, which is gitignored and so would only
   * apply on the machine that created it.
   */
  env: {
    NEXT_PUBLIC_CLIENT_APP: 'backoffice',
  },
  images: {
    remotePatterns: imageRemotePatterns(),
  },
};

export default nextConfig;
