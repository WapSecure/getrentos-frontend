import { TOUR_HOSTS } from '@sureground/shared';

const EMBED_FAMILIES: readonly (readonly string[])[] = [
  ['youtube.com', 'youtube-nocookie.com'],
  ['vimeo.com'],
  ...TOUR_HOSTS.map((host) => [host]),
];

function httpsHost(raw: string): string | null {
  const match = /^https:\/\/([^/?#:]+)(?::\d+)?(?:[/?#]|$)/i.exec(raw.trim());
  return match ? match[1]!.toLowerCase() : null;
}

const within = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

/** The provider domains an embed may navigate between, or null when the URL isn't a known player. */
export function embedFamily(url: string): readonly string[] | null {
  const host = httpsHost(url);
  if (!host) return null;
  return EMBED_FAMILIES.find((family) => family.some((d) => within(host, d))) ?? null;
}

export type EmbedNavigation = 'allow' | 'external' | 'block';

export function embedNavigation(
  family: readonly string[],
  url: string,
  isTopFrame = true
): EmbedNavigation {
  if (url === 'about:blank') return 'allow';
  const host = httpsHost(url);
  if (!host) return 'block';
  // A player's own iframes pull from its CDNs; only what replaces the whole page could pose as the app.
  if (!isTopFrame) return 'allow';
  return family.some((d) => within(host, d)) ? 'allow' : 'external';
}
