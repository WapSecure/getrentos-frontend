/**
 * When a confirmed video viewing can be joined: from 15 minutes before the
 * booked time to 2 hours after it. Mirrors the API, which enforces it.
 */
export const VIDEO_CALL_OPENS_BEFORE_MS = 15 * 60 * 1000;
export const VIDEO_CALL_CLOSES_AFTER_MS = 2 * 60 * 60 * 1000;

export type VideoCallState =
  | { state: 'none' }
  | { state: 'upcoming'; opensAt: Date }
  | { state: 'open' }
  | { state: 'ended' };

export function videoCallState(
  viewing: { mode?: string; status: string; scheduledAt?: string | null },
  now = new Date()
): VideoCallState {
  if (viewing.mode !== 'video' || viewing.status !== 'confirmed' || !viewing.scheduledAt) {
    return { state: 'none' };
  }
  const at = new Date(viewing.scheduledAt).getTime();
  if (Number.isNaN(at)) return { state: 'none' };
  const opensAt = at - VIDEO_CALL_OPENS_BEFORE_MS;
  if (now.getTime() < opensAt) return { state: 'upcoming', opensAt: new Date(opensAt) };
  if (now.getTime() > at + VIDEO_CALL_CLOSES_AFTER_MS) return { state: 'ended' };
  return { state: 'open' };
}

/** What the API hands back to join a call. */
export interface VideoCallJoin {
  joinUrl: string;
  roomUrl: string;
  token: string;
  expiresAt: string;
}
