import appLinks from '@sureground/shared/constants/app-links.json';

// Paths come from packages/shared/src/constants/app-links.json, the list the app build claims, so site and app never disagree; without APPLE_TEAM_ID / ANDROID_CERT_SHA256 the files are not served.

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

export function appleAppSiteAssociation(env: AppLinkEnv) {
  if (!env.appleTeamId || !env.iosBundleId) return null;
  const appID = `${env.appleTeamId}.${env.iosBundleId}`;
  return {
    applinks: {
      details: [
        {
          appIDs: [appID],
          components: [
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
