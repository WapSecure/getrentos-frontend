import type { NextConfig } from 'next';

type ImageRemotePattern = {
  protocol?: 'http' | 'https';
  hostname: string;
  port?: string;
  pathname?: string;
};

// The Sureground API serves avatar and verification images, so its host must be allowed for next/image.
function imageRemotePatterns(): ImageRemotePattern[] {
  // Omit `port` to match any; `port: '*'` matches none, which broke every locally uploaded avatar.
  const patterns: ImageRemotePattern[] = [{ protocol: 'http', hostname: 'localhost' }];

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
  transpilePackages: ['@sureground/shared', '@sureground/ui'],
  // The API namespaces its refresh cookie per app: the back office and web app share a host, so without this they rotated each other's session.
  // It also makes the API refuse a non-staff account at staff sign-in. Set here because .env.local is gitignored.
  env: {
    NEXT_PUBLIC_CLIENT_APP: 'backoffice',
  },
  images: {
    remotePatterns: imageRemotePatterns(),
    // Next 16 refuses to optimise images whose host resolves to a private IP; MinIO is on localhost, so allow it in dev only.
    ...(process.env.NODE_ENV !== 'production' ? { dangerouslyAllowLocalIP: true } : {}),
  },
};

export default nextConfig;
