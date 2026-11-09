import appLinks from '@sureground/shared/constants/app-links.json';

/**
 * The two files phones fetch from this site to let the Sureground app open
 * links to it (iOS universal links, Android app links). The paths come from
 * packages/shared/src/constants/app-links.json, the same list the app's build
 * claims, so the site and the app never disagree.
 *
 * Configured by environment, because the IDs belong to the app store accounts:
 * - APPLE_TEAM_ID (required for iOS), IOS_BUNDLE_ID (default io.getsureground.app)
 * - ANDROID_CERT_SHA256: comma-separated SHA-256 signing-certificate
 *   fingerprints (required for Android; Play App Signing's key, plus the upload
 *   key for internal builds), ANDROID_PACKAGE (default io.getsureground.app)
 * Without them the files are not served, and links simply open the website.
 */

export interface AppLinkEnv {
  appleTeamId?: string;
  iosBundleId?: string;
  androidPackage?: string;
  androidCertSha256?: string;
}

export function appLinkEnv(env: NodeJS.ProcessEnv = process.env): AppLinkEnv {
  return {
    appleTeamId: env.APPLE_TEAM_ID?.trim(),
    iosBundleId: env.IOS_BUNDLE_ID?.trim() || 'io.getsureground.app',
    androidPackage: env.ANDROID_PACKAGE?.trim() || 'io.getsureground.app',
    androidCertSha256: env.ANDROID_CERT_SHA256?.trim(),
  };
}

/** apple-app-site-association, or null when the team ID is not configured. */
export function appleAppSiteAssociation(env: AppLinkEnv) {
  if (!env.appleTeamId || !env.iosBundleId) return null;
  const appID = `${env.appleTeamId}.${env.iosBundleId}`;
  return {
    applinks: {
      details: [
        {
          appIDs: [appID],
          components: [
            // Pages under a claimed prefix that only the website has.
            ...appLinks.webOnly.map((p) => ({ '/': `${p}*`, exclude: true })),
            ...appLinks.claimed.flatMap((p) => [{ '/': p }, { '/': `${p}/*` }]),
          ],
        },
      ],
    },
    // Passkeys created in the app are shared with this site.
    webcredentials: { apps: [appID] },
  };
}

/** assetlinks.json statements, or null when no certificate is configured. */
export function assetLinks(env: AppLinkEnv) {
  const fingerprints = (env.androidCertSha256 ?? '')
    .split(',')
    .map((f) => f.trim().toUpperCase())
    .filter(Boolean);
  if (!fingerprints.length || !env.androidPackage) return null;
  return [
    {
      relation: [
        'delegate_permission/common.handle_all_urls',
        'delegate_permission/common.get_login_creds',
      ],
      target: {
        namespace: 'android_app',
        package_name: env.androidPackage,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];
}
