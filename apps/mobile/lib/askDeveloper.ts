import {
  DEVELOPMENT_ENQUIRY_LIMITS,
  type DevelopmentEnquiryStatus,
  type ShowroomUnitType,
} from '@sureground/shared/showroom';
import { isDevelopmentId } from './developments';

/**
 * Pure helpers for "Ask the developer" on the development screen. The copy, limits, form check and
 * mappers come from the shared `developmentEnquiries.ts`, so the app says exactly what the web says.
 */

/** The development screen. It sits in `(public)`, so signed-in people can open it too. */
export const developmentRoute = (id: string) => `/(public)/development/${encodeURIComponent(id)}`;

/** `/developments/<id>`, with or without host, query or `#your-questions`, to the development screen. */
export function developmentRouteForPath(url?: string | null): string | null {
  if (!url) return null;
  const path = url
    .replace(/^https?:\/\/[^/]+/, '')
    .split(/[?#]/)[0]
    .replace(/\/$/, '');
  const match = /^\/developments\/([^/]+)$/.exec(path);
  if (!match) return null;
  let id: string;
  try {
    id = decodeURIComponent(match[1]);
  } catch {
    return null;
  }
  return isDevelopmentId(id) ? developmentRoute(id) : null;
}

// Memory only and short-lived, like a pending listing: an abandoned sign-in must not hijack a later one.
const TTL_MS = 30 * 60 * 1000;
let pending: { id: string; at: number } | null = null;

/** Signed out, "Sign in to ask the developer" remembers where to come back to. */
export function rememberAskIntent(id: string, now = Date.now()) {
  pending = isDevelopmentId(id) ? { id, at: now } : null;
}

/** Once, after sign-in: the development screen to return to, if the intent is still fresh. */
export function takeAskIntent(now = Date.now()): string | null {
  const intent = pending && now - pending.at <= TTL_MS ? pending : null;
  pending = null;
  return intent ? developmentRoute(intent.id) : null;
}

export const NO_UNIT_LABEL = 'No particular unit type';

/** The unit type choices, "none in particular" first; none at all when the developer listed none. */
export function unitTypeChoices(
  unitTypes: Pick<ShowroomUnitType, 'id' | 'name'>[]
): { id: string | undefined; label: string }[] {
  if (unitTypes.length === 0) return [];
  return [
    { id: undefined, label: NO_UNIT_LABEL },
    ...unitTypes.map((u) => ({ id: u.id, label: u.name })),
  ];
}

/** The body for `POST /developments/:id/enquiries`. */
export function enquiryBody(message: string, unitTypeId?: string) {
  return { message: message.trim(), ...(unitTypeId ? { unitTypeId } : {}) };
}

export const SEND_FAILED = 'Your question was not sent. Try again.';
export const SEND_TOO_OFTEN = 'You have sent a lot of questions. Try again in a little while.';
export const OPEN_LIMIT_REACHED = `You have ${DEVELOPMENT_ENQUIRY_LIMITS.openPerDevelopment} questions waiting for an answer from this developer. You can ask more once they answer.`;

/** What to show under the form when a send fails: the API's own words when it gives them. */
export function sendProblem(e: unknown): string {
  const status =
    e && typeof e === 'object' && typeof (e as { status?: unknown }).status === 'number'
      ? (e as { status: number }).status
      : undefined;
  const message =
    e instanceof Error && e.message.trim() && status !== undefined && status > 0
      ? e.message.trim()
      : undefined;
  if (status === 429) return message ?? SEND_TOO_OFTEN;
  return message ?? SEND_FAILED;
}

export const ENQUIRY_STATUS_TONE: Record<
  DevelopmentEnquiryStatus,
  'warning' | 'success' | 'neutral'
> = {
  NEW: 'warning',
  ANSWERED: 'success',
  CLOSED: 'neutral',
};
