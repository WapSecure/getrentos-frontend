import * as WebBrowser from 'expo-web-browser';
import { env } from '@/lib/env';
import { resolveIncomingLink } from '@/lib/deepLinks';
import { rememberListing } from '@/lib/pendingListing';

/**
 * Rewrites a tapped link before the router sees it (Expo Router native intent).
 * Website links carry the website's paths, so they are mapped onto app routes
 * in lib/deepLinks. A listing is remembered so a signed-in person lands on it
 * in the workspace that can act on it; a page the app lacks opens in the browser.
 * It must never throw: a failure here would stop the app from opening.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const target = resolveIncomingLink(path, env.webUrl);
    if (!target) return path;
    if ('web' in target) {
      WebBrowser.openBrowserAsync(target.web).catch(() => undefined);
      return '/';
    }
    if (target.listing) rememberListing(target.listing.kind, target.listing.id);
    return target.route;
  } catch {
    return '/';
  }
}
