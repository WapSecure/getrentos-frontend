/**
 * Layered on app.json.
 *
 * - Passkeys (WebAuthn) bind to a registrable domain. iOS needs the Associated
 *   Domains entitlement (`webcredentials:<rpid>`) for it; Android verifies via a
 *   server-hosted assetlinks.json and needs no app-side entry. Set
 *   WEBAUTHN_RP_ID at build time to the same shared parent domain the backend
 *   uses, and host apple-app-site-association + assetlinks.json under it.
 * - App links: with APP_LINK_DOMAIN set (e.g. getrentos.com), website links to
 *   the paths in packages/shared/src/constants/app-links.json open the app
 *   instead of the browser: iOS via `applinks:` (the site serves
 *   /.well-known/apple-app-site-association), Android via a verified intent
 *   filter (the site serves /.well-known/assetlinks.json). lib/deepLinks maps
 *   each path onto an app route.
 * - A build for testing against a computer on the local network (EAS profile
 *   "device-test") talks plain http, which Android 9+ blocks unless the app
 *   opts in. Only that profile sets ALLOW_CLEARTEXT, so preview and production
 *   builds stay https-only.
 */
const appLinks = require('@getrentos/shared/constants/app-links.json');

/** Adds iOS associated domains and Android verified link filters for the website. */
function withAppLinks(config, domain) {
  if (!domain) return config;
  return {
    ...config,
    ios: {
      ...config.ios,
      associatedDomains: [...(config.ios?.associatedDomains ?? []), `applinks:${domain}`],
    },
    android: {
      ...config.android,
      intentFilters: [
        ...(config.android?.intentFilters ?? []),
        {
          action: 'VIEW',
          autoVerify: true,
          category: ['BROWSABLE', 'DEFAULT'],
          // Each path exactly, and everything below it. A bare pathPrefix is a
          // plain string match, so "/l" alone would also catch "/login".
          data: appLinks.claimed.flatMap((path) => [
            { scheme: 'https', host: domain, path },
            { scheme: 'https', host: domain, pathPrefix: `${path}/` },
          ]),
        },
      ],
    },
  };
}

module.exports = ({ config: base }) => {
  const config = withAppLinks(base, process.env.APP_LINK_DOMAIN);
  const rpId = process.env.WEBAUTHN_RP_ID;
  const withPasskey = rpId
    ? {
        ...config,
        ios: {
          ...config.ios,
          associatedDomains: [...(config.ios?.associatedDomains ?? []), `webcredentials:${rpId}`],
        },
      }
    : config;

  return process.env.ALLOW_CLEARTEXT === '1'
    ? {
        ...withPasskey,
        plugins: [
          ...(withPasskey.plugins ?? []),
          ['expo-build-properties', { android: { usesCleartextTraffic: true } }],
        ],
      }
    : withPasskey;
};
