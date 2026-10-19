import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { LandSiteTour } from '@/types/landSiteTour';

const post = <T>(path: string, body?: unknown) =>
  authFetch<T>(path, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

const tourPath = (side: 'buyer' | 'owner', tourId: string) =>
  `/${side}/land/tours/${encodeURIComponent(tourId)}`;

export const landSiteTourKeys = {
  buyer: ['land', 'tours', 'buyer'] as const,
  host: ['land', 'tours', 'host'] as const,
  attending: ['land', 'tours', 'attending'] as const,
};

/** Live guided video tours: the buyer's, the host's and the attendee's calls. */
export const landSiteTourService = {
  // ─── The buyer ─────────────────────────────────────────────────────────────
  mine: () => safeCall(() => authFetch<LandSiteTour[]>('/buyer/land/tours')),

  request: (input: {
    listingId?: string;
    plotId?: string;
    timeZone: string;
    preferredTimes?: string;
    attendeeAppointmentId?: string;
  }) =>
    safeCall(() =>
      post<LandSiteTour>('/buyer/land/tours', {
        ...(input.listingId ? { listingId: input.listingId } : {}),
        ...(input.plotId ? { plotId: input.plotId } : {}),
        timeZone: input.timeZone,
        ...(input.preferredTimes?.trim() ? { preferredTimes: input.preferredTimes.trim() } : {}),
        ...(input.attendeeAppointmentId
          ? { attendeeAppointmentId: input.attendeeAppointmentId }
          : {}),
        acknowledgedNotASearch: true,
      })
    ),

  choose: (tourId: string, slot: string) =>
    safeCall(() => post<LandSiteTour>(`${tourPath('buyer', tourId)}/choose`, { slot })),

  otherTimes: (tourId: string, reason: string) =>
    safeCall(() =>
      post<LandSiteTour>(`${tourPath('buyer', tourId)}/other-times`, { reason: reason.trim() })
    ),

  reportNoShow: (tourId: string) =>
    safeCall(() => post<LandSiteTour>(`${tourPath('buyer', tourId)}/host-no-show`)),

  feedback: (tourId: string, rating: number, comment?: string) =>
    safeCall(() =>
      post<LandSiteTour>(`${tourPath('buyer', tourId)}/feedback`, {
        rating,
        ...(comment?.trim() ? { comment: comment.trim() } : {}),
      })
    ),

  // ─── The host ──────────────────────────────────────────────────────────────
  hosting: () => safeCall(() => authFetch<LandSiteTour[]>('/owner/land/tours')),

  propose: (tourId: string, slots: string[], meetingUrl: string) =>
    safeCall(() =>
      post<LandSiteTour>(`${tourPath('owner', tourId)}/propose`, {
        slots,
        meetingUrl: meetingUrl.trim(),
      })
    ),

  complete: (tourId: string, notes: string) =>
    safeCall(() =>
      post<LandSiteTour>(`${tourPath('owner', tourId)}/complete`, { notes: notes.trim() })
    ),

  // ─── Either side ───────────────────────────────────────────────────────────
  cancel: (side: 'buyer' | 'owner', tourId: string, reason: string) =>
    safeCall(() =>
      post<LandSiteTour>(`${tourPath(side, tourId)}/cancel`, { reason: reason.trim() })
    ),

  attending: () => safeCall(() => authFetch<LandSiteTour[]>('/land/representing/tours')),
};

/**
 * A "YYYY-MM-DDTHH:mm" value typed as Lagos wall-clock time, as an ISO
 * instant. Lagos is UTC+1 all year (no daylight saving).
 */
export const lagosLocalToIso = (value: string): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const at = new Date(`${value}:00+01:00`);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
};
