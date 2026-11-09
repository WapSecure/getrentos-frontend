import * as WebBrowser from 'expo-web-browser';
import { env } from '@/lib/env';
import { resolveIncomingLink } from '@/lib/deepLinks';
import { rememberListing } from '@/lib/pendingListing';

/** Must never throw: a failure here would stop the app from opening. */
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
