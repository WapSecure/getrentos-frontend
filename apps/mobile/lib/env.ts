import Constants from 'expo-constants';

// Assumes the API is on port 4000 on the Metro host.
function resolveApiUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit && /^https?:\/\//.test(explicit)) return explicit.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;

  if (typeof hostUri === 'string') {
    const host = hostUri.replace(/^\w+:\/\//, '').split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:4000`;
    }
  }
  return 'http://localhost:4000';
}

const API_URL = resolveApiUrl();

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://getsureground.io').replace(/\/$/, '');

export const env = {
  apiUrl: API_URL,
  webUrl: WEB_URL,
  // Makes the API return the refresh token in the body.
  clientApp: 'mobile' as const,
  mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
};
