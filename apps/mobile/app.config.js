/**
 * Passkeys: iOS needs the `webcredentials:<rpid>` entitlement; set WEBAUTHN_RP_ID to the backend's shared parent domain.
 * App links: with APP_LINK_DOMAIN set, website paths in packages/shared/src/constants/app-links.json open the app.
 * Only the "device-test" profile sets ALLOW_CLEARTEXT, so preview and production builds stay https-only.
 */
const appLinks = require('@sureground/shared/constants/app-links.json');

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
          // A bare pathPrefix is a plain string match, so "/l" alone would also catch "/login".
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
