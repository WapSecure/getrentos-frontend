import Constants from 'expo-constants';

interface ApiUrlSource {
  explicit: string | undefined;
  hostUri: unknown;
  isDev: boolean;
  allowInsecure?: boolean;
}

// Assumes the API is on port 4000 on the Metro host.
export function resolveApiUrl({ explicit, hostUri, isDev, allowInsecure }: ApiUrlSource): string {
  if (!isDev && !allowInsecure) {
    if (!explicit || !/^https:\/\//i.test(explicit)) {
      throw new Error(
        `EXPO_PUBLIC_API_URL must be an https:// URL outside development builds (got ${explicit ? `"${explicit}"` : 'nothing'}).`
      );
    }
    return explicit.replace(/\/$/, '');
  }

  if (explicit && /^https?:\/\//.test(explicit)) return explicit.replace(/\/$/, '');

  if (typeof hostUri === 'string') {
    const host = hostUri.replace(/^\w+:\/\//, '').split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:4000`;
    }
  }
  return 'http://localhost:4000';
}

const API_URL = resolveApiUrl({
  explicit: process.env.EXPO_PUBLIC_API_URL,
  hostUri: Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost,
  isDev: typeof __DEV__ !== 'undefined' && __DEV__,
  // Only the internal "device-test" profile sets this, to reach a LAN backend from a release APK.
  allowInsecure: process.env.EXPO_PUBLIC_ALLOW_INSECURE_API === '1',
});

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://getsureground.io').replace(/\/$/, '');

export const env = {
  apiUrl: API_URL,
  webUrl: WEB_URL,
  // Makes the API return the refresh token in the body.
  clientApp: 'mobile' as const,
  mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
};
