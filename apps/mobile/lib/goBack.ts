import { router, type Href } from 'expo-router';

// A screen opened from a push, an email link or a reload has no history, so back falls back to the app root.
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
