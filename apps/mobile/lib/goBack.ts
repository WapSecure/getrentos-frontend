import { router, type Href } from 'expo-router';

/**
 * Back, or home when there is nothing to go back to.
 *
 * A screen opened straight from a push notification, an email link or a
 * reload has no history, so a plain router.back() does nothing and the back
 * button looks broken. The fallback is the app root, which routes each
 * account to its own home.
 */
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
