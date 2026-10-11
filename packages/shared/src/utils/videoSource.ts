/**
 * What a listing's video or tour link is, and how to show it.
 *
 * Hosts paste links (YouTube, Vimeo, Matterport…) as well as uploading files.
 * A pasted page URL cannot play in a <video> element, and an arbitrary URL
 * must never be framed, so every link is read through here: known providers
 * become their official embed URL, anything else is refused.
 */
export type VideoSource =
  | { kind: 'file'; url: string }
  | { kind: 'youtube'; id: string; embedUrl: string }
  | { kind: 'vimeo'; id: string; embedUrl: string };

export type TourSource = { kind: 'tour'; host: string; embedUrl: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function parse(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/** A YouTube or Vimeo page link as an embeddable player; null for anything else. */
export function embeddedVideo(raw: string | null | undefined): VideoSource | null {
  if (!raw) return null;
  const url = parse(raw);
  if (!url) return null;
  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');

  let youtubeId: string | null = null;
  if (host === 'youtu.be') youtubeId = url.pathname.slice(1).split('/')[0] ?? null;
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') youtubeId = url.searchParams.get('v');
    else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
      youtubeId = m?.[1] ?? null;
    }
  }
  if (youtubeId && YOUTUBE_ID.test(youtubeId)) {
    return {
      kind: 'youtube',
      id: youtubeId,
      // The privacy-enhanced host: no tracking cookies until the viewer presses play.
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&playsinline=1`,
    };
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = url.pathname.match(/(?:^|\/)(\d{5,12})(?:\/|$)/);
    if (m) {
      return { kind: 'vimeo', id: m[1], embedUrl: `https://player.vimeo.com/video/${m[1]}?dnt=1` };
    }
  }
  return null;
}

/**
 * A listing's video as something playable: an embedded YouTube/Vimeo player
 * for a pasted link, or the file itself for an uploaded one.
 */
export function videoSource(url: string | null | undefined): VideoSource | null {
  if (!url) return null;
  const embedded = embeddedVideo(url);
  if (embedded) return embedded;
  // An uploaded file arrives as a signed storage URL.
  return parse(url) || url.startsWith('http://localhost') ? { kind: 'file', url } : null;
}

/** 360° / virtual-tour providers whose pages may be framed. */
export const TOUR_HOSTS = ['matterport.com', 'kuula.co', 'cloudpano.com', 'theasys.io', 'momento360.com'];

/** A 360° tour link as an embeddable page; null for an unknown or unsafe link. */
export function tourSource(raw: string | null | undefined): TourSource | null {
  if (!raw) return null;
  const url = parse(raw);
  if (!url) return null;
  const host = url.hostname.replace(/^www\./, '');
  const allowed = TOUR_HOSTS.find((h) => host === h || host.endsWith(`.${h}`));
  return allowed ? { kind: 'tour', host: allowed, embedUrl: url.toString() } : null;
}
