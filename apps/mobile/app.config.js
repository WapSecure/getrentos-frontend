/**
 * Layered on app.json.
 *
 * - Passkeys (WebAuthn) bind to a registrable domain. iOS needs the Associated
 *   Domains entitlement (`webcredentials:<rpid>`) for it; Android verifies via a
 *   server-hosted assetlinks.json and needs no app-side entry. Set
 *   WEBAUTHN_RP_ID at build time to the same shared parent domain the backend
 *   uses, and host apple-app-site-association + assetlinks.json under it.
 * - A build for testing against a computer on the local network (EAS profile
 *   "device-test") talks plain http, which Android 9+ blocks unless the app
 *   opts in. Only that profile sets ALLOW_CLEARTEXT, so preview and production
 *   builds stay https-only.
 */
module.exports = ({ config }) => {
  const rpId = process.env.WEBAUTHN_RP_ID;
  const withPasskey = rpId
    ? {
        ...config,
        ios: {
          ...config.ios,
          associatedDomains: [
            ...(config.ios?.associatedDomains ?? []),
            `webcredentials:${rpId}`,
          ],
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
