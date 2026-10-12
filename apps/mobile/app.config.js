/**
 * Layered on app.json. A build for testing against a computer on the local
 * network (EAS profile "device-test") talks plain http, which Android 9+
 * blocks unless the app opts in. Only that profile sets ALLOW_CLEARTEXT, so
 * preview and production builds stay https-only.
 */
module.exports = ({ config }) =>
  process.env.ALLOW_CLEARTEXT === '1'
    ? {
        ...config,
        plugins: [
          ...(config.plugins ?? []),
          ['expo-build-properties', { android: { usesCleartextTraffic: true } }],
        ],
      }
    : config;
